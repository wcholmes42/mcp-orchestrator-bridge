# MCP Orchestrator Bridge

Claude Desktop extension that bridges to MCP Orchestrator for unified access to multiple MCP servers.

## What It Does

Connects Claude Desktop to an MCP Orchestrator server running on your network, exposing all configured MCP servers through a single extension. Instead of configuring each MCP server individually in Claude Desktop, you configure them once in the Orchestrator and this bridge extension provides access to all of them.

## Installation

1. Install the extension in Claude Desktop:
   - Settings → Extensions → Install Extension
   - Select the `.mcpb` package file

2. Configure the orchestrator URL (default: `http://192.168.68.42:3001`)

3. Restart Claude Desktop

## Configuration

The extension connects to your MCP Orchestrator server. By default it looks for the orchestrator at `http://192.168.68.42:3001`.

You can override this by setting the `ORCHESTRATOR_URL` environment variable in your Claude Desktop configuration.

## How It Works

1. The bridge extension starts when Claude Desktop launches
2. It fetches available tools from the orchestrator's `/list-tools` endpoint
3. When you use a tool, the bridge forwards the request to `/call-tool` on the orchestrator
4. The orchestrator routes to the appropriate MCP server and returns results

## Requirements

- Node.js >= 18.0.0
- Running MCP Orchestrator server (separate setup)
- Network access to orchestrator server

## Development

```bash
npm install
node server/index.js  # Test the server directly
```

## Architecture

```
Claude Desktop
    ↓
MCP Orchestrator Bridge (this extension)
    ↓
MCP Orchestrator Server (http://192.168.68.42:3001)
    ↓
Multiple MCP Servers (Home Assistant, Unraid, etc.)
```

## License

MIT
