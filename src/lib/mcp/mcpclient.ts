import { Logger } from '$lib/logger';
import { AppConfig } from '$lib/config';

const log = Logger.getLogger('MCPClient');

export class McpClient {     
  private static instance: McpClient | null = null;
  private mcpTools: any[] | null = null;
  private initialized = false;

  private constructor() {}

  /**
   * Get the singleton instance of the McpClient.
   */
  static getInstance(): McpClient {
    if (!McpClient.instance) {
      McpClient.instance = new McpClient();
    }
    return McpClient.instance;
  }

  /**
   * Initialize the MCP client and tools.
   * Loads MCP_SERVERS config and prepares tools if not already initialized.
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    const config = await AppConfig.getInstance().get("mcpServer");
    if (!config || typeof config !== "object") {
      await log.warn("No MCP_SERVERS config found; skipping MCP tool loading.");
      this.mcpTools = [];
      this.initialized = true;
      return;
    }

    this.mcpClient = new MultiServerMCPClient({
      mcpServers: config,
      throwOnLoadError: false,
      prefixToolNameWithServerName: true,
      additionalToolNamePrefix: "mcp",
      useStandardContentBlocks: true,
    });

    try {
      this.mcpTools = await this.mcpClient.getTools();
      await log.info(`Loaded ${this.mcpTools.length} MCP tools.`);
    } catch (err) {
      await log.error(`Failed to load MCP tools: ${err}`);
      this.mcpTools = [];
    }
    this.initialized = true;
  }

  /**
   * Get all available MCP tools (async).
   */
  async getTools(): Promise<any[]> {
    if (!this.initialized) {
      await this.init();
    }
    return this.mcpTools ?? [];
  }

  /**
   * Gracefully close the MCP client and clear state.
   */
  async close(): Promise<void> {
    if (this.mcpClient) {
      await this.mcpClient.close();
      this.mcpClient = null;
      this.mcpTools = null;
      this.initialized = false;
      await log.info("Closed MCP client.");
    }
  }
}