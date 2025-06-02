import { invoke } from '@tauri-apps/api/core';

export class McpServerClient {
  private readonly connection_id: string;

  constructor(connection_id: string) {
    this.connection_id = connection_id;
  }

  async connect(command: string, args: string[] = []) {
    return invoke('connect_server', {
      connectionId: this.connection_id,
      command,
      args,
    });
  }

  async disconnect() {
    return invoke('disconnect_server', {
      connectionId: this.connection_id,
    });
  }

  async listTools() {
    return invoke('list_tools', {
      connectionId: this.connection_id,
    });
  }

  async callTool(name: string, args?: Record<string, any>) {
    return invoke('call_tool', {
      connectionId: this.connection_id,
      name,
      args,
    });
  }

  getConnectionId() {
    return this.connection_id;
  }  
}
