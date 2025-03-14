# File Merger MCP Server

简单实用的文件合并工具。快速、安全、易于使用。

## 功能特点

- **简单** - 一个命令合并任意数量的文件
- **快速** - 高效合并任何大小的文件
- **安全** - 仅访问您允许的目录
- **详细** - 提供文件大小和合并摘要

## API

### 工具

- **merge_files**
  - 输入参数：
    - `inputPaths` (字符串数组)：要合并的文件
    - `outputPath` (字符串)：输出文件位置
  - 返回结果：
    - 合并成功的消息和详情

- **list_allowed_directories**
  - 列出服务器可以访问的目录

## 与 Claude Desktop 一起使用

添加到您的 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "file-merger": {
      "command": "npx",
      "args": [
        "-y",
        "@exoticknight/mcp-file-merger",
        "/path/to/allowed/dir"
      ]
    }
  }
}
```

## 安装

```bash
# 克隆并安装
git clone https://github.com/exoticknight/mcp-file-merger.git
cd mcp-file-merger
npm install
npm run build
```

## 许可证

Apache License 2.0
