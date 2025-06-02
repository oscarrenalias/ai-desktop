import { invoke } from '@tauri-apps/api/core';

export async function testMcp() {
  try {
    const connection_id = 'test-conn-frontend';
    // Start the MCP server (replace with your actual command and args)
    await invoke('connect_server', {
      connectionId: connection_id,
      command: 'docker',
      args: ["run", "-i", "--rm", "ghcr.io/oscarrenalias/mcp-server-bmi:latest" ]
    });
    console.log(`MCP server started. Id: ${connection_id}`);

    // List available tools
    const tools = await invoke('list_tools', { connectionId: connection_id });
    console.log('Available tools:', tools);

    // call one of the tools
    const bmiArgs = { height: 1.75, weight: 70 };
    const bmiResult = await invoke('call_tool', {
      connectionId: connection_id,
      name: "calculate_bmi",
      args: bmiArgs
    });
    console.log('calculate_bmi tool result:', bmiResult);

    // disconnect the MCP server
    await invoke('disconnect_server', { connectionId: connection_id });
    console.log('MCP server disconnected.');

    // try with another server
    const mcp_server_fetch = 'mcp-server-fetch';    
    await invoke('connect_server', {
      connectionId: mcp_server_fetch,
      command: 'uvx',
      args: [ "mcp-server-fetch" ]
    });
      console.log(`MCP server fetch started. Id: ${mcp_server_fetch}`);
    // list tools
    const mcp_fetch_tools = await invoke('list_tools', { connectionId: mcp_server_fetch });
    console.log('MCP fetch tools:', mcp_fetch_tools);
    // call the fetch tool
    const fetch_result = await invoke('call_tool', {
      connectionId: mcp_server_fetch,
      name: "fetch",
      args: { url: "https://www.bbc.com/news" }
    });
    console.log('Fetch tool result:', fetch_result);
    // disconnect the MCP server
    await invoke('disconnect_server', { connectionId: mcp_server_fetch });
    console.log('MCP server fetch disconnected.');

  } catch (err) {
    console.error('Error:', err);
  }
}