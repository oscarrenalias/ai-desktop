import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from '@langchain/core/messages';
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { tool } from "@langchain/core/tools"
import { AppConfig } from "$lib/config"; 

import { z } from "zod";

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

async function getAgent() {
  const apiKeyRaw = await appConfig.get("OPENAI_API_KEY");
  const apiKey = typeof apiKeyRaw === 'string' ? apiKeyRaw : undefined;

  console.log("Using OpenAI API Key:", apiKey);

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
  const agent = await getAgent();
  const result = await agent.invoke({
    messages: [{
      role: "user",
      content: input
    }]
  });
  // Extract the assistant's reply from the result object
  const lastMessage = result.messages[result.messages.length - 1];
  return typeof lastMessage.content === "string" ? lastMessage.content : JSON.stringify(lastMessage.content);
}