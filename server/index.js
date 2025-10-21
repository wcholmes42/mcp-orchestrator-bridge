#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://192.168.68.42:3001';

// Cache for tools
let cachedTools = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 1 minute

async function fetchAvailableTools() {
  const now = Date.now();
  if (cachedTools && (now - lastFetchTime) < CACHE_TTL) {
    return cachedTools;
  }

  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/list-tools`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tools: ${response.statusText}`);
    }
    
    const data = await response.json();
    cachedTools = data.tools || [];
    lastFetchTime = now;
    
    console.error(`[Bridge] Loaded ${cachedTools.length} tools from orchestrator`);
    return cachedTools;
  } catch (error) {
    console.error(`[Bridge] Error fetching tools: ${error.message}`);
    return [];
  }
}

async function callOrchestratorTool(toolName, args) {
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/call-tool`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: toolName,
        arguments: args,
      }),
    });

    if (!response.ok) {
      throw new Error(`Orchestrator call failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`[Bridge] Error calling tool ${toolName}:`, error.message);
    throw error;
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'mcp-orchestrator-bridge',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tools/list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = await fetchAvailableTools();
  
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description || '',
      inputSchema: tool.inputSchema || {
        type: 'object',
        properties: {},
      },
    })),
  };
});

// Handle tools/call
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[Bridge] Calling tool: ${name}`);

  try {
    const result = await callOrchestratorTool(name, args);
    
    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Bridge] MCP Orchestrator Bridge started');
  console.error(`[Bridge] Connecting to orchestrator at: ${ORCHESTRATOR_URL}`);
}

main().catch((error) => {
  console.error('[Bridge] Fatal error:', error);
  process.exit(1);
});
