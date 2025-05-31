import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from '@langchain/core/messages';
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { tool } from "@langchain/core/tools"
import { AppConfig } from "$lib/config"; 
import { Logger } from "$lib/logger"

import { z } from "zod";

let logger = Logger.getLogger("agent");

// test tool that simulates a web search
const search = tool(async ({ query }) => {
  if (query.toLowerCase().includes("sf") || query.toLowerCase().includes("san francisco")) {
    return "It's 60 degrees and foggy."
  }
  return "It's 90 degrees and sunny."
}, {
  name: "search",
  description: "Call to surf the web.",
  schema: z.object({
    query: z.string().describe("The query to use in your search."),
  }),
});

let appConfig = AppConfig.getInstance();

// Encapsulated agent state
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

async function getAgent() {
  const apiKeyRaw = await appConfig.get("OPENAI_API_KEY");
  const apiKey = typeof apiKeyRaw === 'string' ? apiKeyRaw : undefined;

  const model = new ChatOpenAI({
    temperature: 0.7,
    modelName: 'gpt-4',
    streaming: false,
    apiKey: apiKey,
  });
  return createReactAgent({
    llm: model,
    tools: [search],
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

export { agentState };