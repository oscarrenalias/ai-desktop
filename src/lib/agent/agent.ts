import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { AppConfig } from "$lib/config";
import { Logger } from "$lib/logger";
import { z } from "zod";

let logger = Logger.getLogger("agent");

// test tool that simulates a web search
const weather_forecast = tool(async ({ query }) => {
  if (query.toLowerCase().includes("hki") || query.toLowerCase().includes("helsinki")) {
    return "15 degrees and cloudy"
  }
  return "20 degrees and sunny"
}, {
  name: "weather_forecast",
  description: "Returnst he current weather in the requested city.",
  schema: z.object({
    query: z.string().describe("The city to get the weather forecast for."),
  }),
});

let appConfig = AppConfig.getInstance();

class AgentState {
  private messages: { role: string; content: string }[] = [];

  addMessage(message: { role: string; content: string }) {
    this.messages.push(message);
  }

  getMessages() {
    return this.messages;
  }
}

const agentState = new AgentState();

async function getAgent(onToken?: (token: string) => void) {
  const apiKeyRaw = await appConfig.get("OPENAI_API_KEY");
  const apiKey = typeof apiKeyRaw === 'string' ? apiKeyRaw : undefined;

  const model = new ChatOpenAI({
    temperature: 1.0,
    modelName: 'gpt-4o',
    streaming: true,
    apiKey: apiKey,
    callbacks: onToken
      ? [{
          handleLLMNewToken(token: string) {
            onToken(token);
          }
        }]
      : [],
  });

  // --- MCP TOOLS INTEGRATION ---
  let mcpTools: any[] = [];
  try {
    const mcpClient = McpClient.getInstance();
    mcpTools = await mcpClient.getTools();
    if (mcpTools.length > 0) {
      await logger.info(`Loaded ${mcpTools.length} MCP tools into agent.`);
    }
  } catch (err) {
    await logger.warn(`MCP tools could not be loaded: ${err}`);
    mcpTools = [];
  }

  return createReactAgent({
    llm: model,
    tools: [weather_forecast/*, ...mcpTools*/],
  });
}

export async function runAgent(input: string): Promise<string> {
  let message = { role: 'user', content: input }
  logger.info(`Agent input: ${JSON.stringify(message)}`);
  
  agentState.addMessage(message);
  const agent = await getAgent();
  const result = await agent.invoke({
    messages: agentState.getMessages()
  });

  // Extract the assistant's reply from the result object
  const lastMessage = result.messages[result.messages.length - 1];
  const reply = typeof lastMessage.content === "string" ? lastMessage.content : JSON.stringify(lastMessage.content);
  agentState.addMessage({ role: 'assistant', content: reply });
  logger.info(`Agent result: ${JSON.stringify(result)}`);
  return reply;
}

export async function runAgentStream(input: string, onStream: (token: string) => void): Promise<string> {
  agentState.addMessage({ role: 'user', content: input });
  let streamed = "";
  const agent = await getAgent((token) => {
    streamed += token;
    onStream(streamed);
  });
  const result = await agent.invoke({
    messages: agentState.getMessages()
  });
  // Extract the assistant's reply from the result object
  const lastMessage = result.messages[result.messages.length - 1];
  const reply = typeof lastMessage.content === "string" ? lastMessage.content : JSON.stringify(lastMessage.content);
  agentState.addMessage({ role: 'assistant', content: reply });
  logger.info(`Agent result: ${JSON.stringify(result)}`);
  return reply;
}

export { agentState };