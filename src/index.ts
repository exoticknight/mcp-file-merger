#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Command line argument parsing - directory permissions
const args = process.argv.slice(2);
let allowedDirectories: string[] = [];

if (args.length > 0) {
  allowedDirectories = args.map(dir => path.resolve(dir));

  // Validate directories if specified
  for (const dir of allowedDirectories) {
    try {
      const stats = await fs.stat(dir);
      if (!stats.isDirectory()) {
        console.error(`Error: ${dir} is not a directory`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error accessing directory ${dir}:`, error);
      process.exit(1);
    }
  }
} else {
  // Default to current directory if no arguments provided
  allowedDirectories = [process.cwd()];
}

// Schema definitions
const MergeFilesArgsSchema = z.object({
  inputPaths: z.array(z.string()).min(1).describe("Array of file paths to merge"),
  outputPath: z.string().describe("Path for the merged output file")
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Security utilities
async function validatePath(requestedPath: string): Promise<string> {
  const absolute = path.isAbsolute(requestedPath)
    ? path.resolve(requestedPath)
    : path.resolve(process.cwd(), requestedPath);

  const normalized = path.normalize(absolute);

  // If allowed directories is empty, allow all
  if (allowedDirectories.length === 0) {
    return normalized;
  }

  // Check if path is within allowed directories
  const isAllowed = allowedDirectories.some(dir => normalized.startsWith(dir));
  if (!isAllowed) {
    throw new Error(`Access denied - path outside allowed directories: ${normalized}, only allowed directories are ${allowedDirectories.join(', ')}, maybe case sensitivity issue?`);
  }

  return normalized;
}

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Server setup
const server = new Server(
  {
    name: "file-merger-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "merge_files",
        description:
          "Merge multiple files into a single output file. Reads content from each input file " +
          "in the order provided and writes it sequentially to the output file. Returns information " +
          "about the merge operation including file sizes and total size. All specified paths must be " +
          "within allowed directories if specified.",
        inputSchema: zodToJsonSchema(MergeFilesArgsSchema) as ToolInput,
      },
      {
        name: "list_allowed_directories",
        description:
          "Returns the list of directories that this server is allowed to access. " +
          "Use this to understand which directories are available before trying to merge files.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "merge_files": {
        const parsed = MergeFilesArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for merge_files: ${parsed.error}`);
        }

        // Validate all paths
        const validInputPaths = await Promise.all(
          parsed.data.inputPaths.map(async (inputPath) => {
            try {
              return await validatePath(inputPath);
            } catch (error) {
              throw new Error(`Invalid input path: ${inputPath} - ${(error as Error).message}`);
            }
          })
        );

        const validOutputPath = await validatePath(parsed.data.outputPath);

        // Check if all input files exist and gather their stats
        const fileStats = await Promise.all(
          validInputPaths.map(async (filePath) => {
            try {
              const stats = await fs.stat(filePath);
              return {
                path: filePath,
                size: stats.size
              };
            } catch (error) {
              throw new Error(`Error accessing file: ${filePath} - ${(error as Error).message}`);
            }
          })
        );

        // Create output directory if necessary
        const outputDir = path.dirname(validOutputPath);
        await fs.mkdir(outputDir, { recursive: true });

        // Create output stream
        const outputStream = createWriteStream(validOutputPath);

        // Process files sequentially using streams
        let totalSize = 0;
        for (const file of fileStats) {
          // Create read stream for current file
          const readStream = createReadStream(file.path);

          // Pipe to output stream
          await pipeline(readStream, outputStream, { end: false });

          totalSize += file.size;
        }

        // Close the output stream
        outputStream.end();

        // Generate and return summary
        const fileList = fileStats.map(f =>
          `- ${path.basename(f.path)} (${formatBytes(f.size)})`
        ).join('\n');

        return {
          content: [{
            type: "text",
            text: `Successfully merged ${fileStats.length} files into ${validOutputPath}

Total size: ${formatBytes(totalSize)}

Files merged:
${fileList}`
          }]
        };
      }

      case "list_allowed_directories": {
        return {
          content: [{
            type: "text",
            text: allowedDirectories.length > 0
              ? `Allowed directories:\n${allowedDirectories.join('\n')}`
              : "No directory restrictions - all directories are allowed"
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP File Merger Server running on stdio");
  console.error(allowedDirectories.length > 0
    ? `Allowed directories: ${allowedDirectories.join(', ')}`
    : "No directory restrictions - all directories are allowed");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
