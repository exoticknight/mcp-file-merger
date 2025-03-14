# File Merger MCP Server

Node.js server implementing Model Context Protocol (MCP) for merging multiple files into one.

## Features

- Merge multiple files into a single output file
- Cross-platform compatibility
- Directory access security controls
- Detailed merge reports with file sizes

**Note**: The server will only allow operations within directories specified via command-line arguments.

## API

### Tools

- **merge_files**
  - Merge multiple files into a single output file
  - Inputs:
    - `inputPaths` (string[]): Array of file paths to merge
    - `outputPath` (string): Path for the merged output file
  - Returns:
    - Success message with merge details
    - List of merged files with sizes
    - Total size of merged output

- **list_allowed_directories**
  - List all directories the server is allowed to access
  - No input required
  - Returns:
    - Directories that this server can read/write from

## Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

### NPX

```json
{
  "mcpServers": {
    "file-merger": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-file-merger",
        "/Users/username/Desktop",
        "/path/to/other/allowed/dir"
      ]
    }
  }
}
```

### Direct Path

```json
{
  "mcpServers": {
    "file-merger": {
      "command": "node",
      "args": [
        "/path/to/mcp-file-merger/dist/index.js",
        "/Users/username/Desktop",
        "/path/to/other/allowed/dir"
      ]
    }
  }
}
```

## Installation

```bash
# Install dependencies and build
npm install
npm run build

# Run locally
node dist/index.js [/path/to/allowed/directory ...]

# Install globally
npm install -g .
mcp-file-merger [/path/to/allowed/directory ...]
```

## Testing

```bash
# Using example script
node scripts/example-usage.js

# Using MCP Inspector
npm install -g @modelcontextprotocol/inspector
mcp-inspector --command "node dist/index.js"
```

## Security

All file paths are validated to ensure they're within allowed directories. If no directories are specified when starting the server, all directories will be accessible.

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License.
