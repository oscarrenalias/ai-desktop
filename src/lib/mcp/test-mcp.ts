import { McpServerClient } from './mcpserverclient';

export async function testMcp() {
  try {
    const mcp = new McpServerClient('test-conn-frontend');
    // Start the MCP server (replace with your actual command and args)
    await mcp.connect('docker', ["run", "-i", "--rm", "ghcr.io/oscarrenalias/mcp-server-bmi:latest"]);
    console.log(`MCP server started. Id: ${mcp.getConnectionId()}`);

    // List available tools
    const tools = await mcp.listTools();
    console.log('Available tools:', tools);

    // call one of the tools
    const bmiArgs = { height: 1.75, weight: 70 };
    const bmiResult = await mcp.callTool("calculate_bmi", bmiArgs);
    console.log('calculate_bmi tool result:', bmiResult);

    // disconnect the MCP server
    await mcp.disconnect();
    console.log('MCP server disconnected.');

    // try with another server
    const mcpFetch = new McpServerClient('mcp-server-fetch');
    await mcpFetch.connect('uvx', ["mcp-server-fetch"]);
    console.log(`MCP server fetch started. Id: mcp-server-fetch`);
    // list tools
    const mcpFetchTools = await mcpFetch.listTools();
    console.log('MCP fetch tools:', mcpFetchTools);
    // call the fetch tool
    const fetchResult = await mcpFetch.callTool("fetch", { url: "https://www.bbc.com/news" });
    console.log('Fetch tool result:', fetchResult);
    // disconnect the MCP server
    await mcpFetch.disconnect();
    console.log('MCP server fetch disconnected.');

  } catch (err) {
    console.error('Error:', err);
  }
}