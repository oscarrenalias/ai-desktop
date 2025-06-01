import { invoke } from '@tauri-apps/api/core';

export async function testMcp() {
  try {
    // Start the MCP server (replace with your actual command and args)
    await invoke('connect_server', {
      command: 'docker',
      args: ["run", "-i", "--rm", "ghcr.io/oscarrenalias/mcp-server-bmi:latest" ]
    });
    console.log('MCP server started.');

    // List available tools
    const tools = await invoke('list_tools');
    console.log('Available tools:', tools);

    // call one of the tools
    const bmiArgs = { height: 1.75, weight: 70 };
    const bmiResult = await invoke('call_tool', {
      name: "calculate_bmi",
      args: bmiArgs
    });
    console.log('calculate_bmi tool result:', bmiResult);

    // disconnect the MCP server
    await invoke('disconnect_server')
    console.log('MCP server disconnected.');
  } catch (err) {
    console.error('Error:', err);
  }
}