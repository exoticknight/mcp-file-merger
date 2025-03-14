# 文件合并 MCP 服务器

基于模型上下文协议(MCP)的 Node.js 服务器，用于将多个文件合并成一个文件。

## 功能特点

- 将多个文件合并为单个输出文件
- 跨平台兼容性
- 目录访问安全控制
- 详细的合并报告（含文件大小）

**注意**：服务器只允许在通过命令行参数指定的目录内进行操作。

## API

### 工具

- **merge_files**
  - 将多个文件合并为单个输出文件
  - 输入参数：
    - `inputPaths` (字符串数组)：要合并的文件路径数组
    - `outputPath` (字符串)：合并后的输出文件路径
  - 返回结果：
    - 合并成功的消息和详情
    - 已合并文件列表及各自大小
    - 合并输出的总大小

- **list_allowed_directories**
  - 列出服务器允许访问的所有目录
  - 无需输入参数
  - 返回结果：
    - 此服务器可以读取/写入的目录

## 与 Claude Desktop 一起使用

将以下配置添加到 `claude_desktop_config.json` 中：

### NPX 方式

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

### 直接路径方式

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

## 安装

```bash
# 安装依赖并构建
npm install
npm run build

# 本地运行
node dist/index.js [/允许访问的目录路径 ...]

# 全局安装
npm install -g .
mcp-file-merger [/允许访问的目录路径 ...]
```

## 测试

```bash
# 使用示例脚本
node scripts/example-usage.js

# 使用 MCP Inspector
npm install -g @modelcontextprotocol/inspector
mcp-inspector --command "node dist/index.js"
```

## 安全性

所有文件路径都会经过验证，确保它们在允许的目录范围内。如果启动服务器时未指定目录，则所有目录都可访问。

## 许可证

此 MCP 服务器采用 MIT 许可证。这意味着您可以自由使用、修改和分发此软件，但需遵守 MIT 许可证的条款和条件。
