import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { analyzeOnchainTokenActivity } from "./tools/onchain-analysis-agent-tools";

export const onchainAnalysisAgent = new Agent({
  name: "Onchain Analysis Agent",
  instructions: `
    You are an onchain analysis agent specializing in ERC20 token analytics using onchain data from the Alchemy SDK.

    Your capabilities include:
    1. Checking recent whale transactions (large transfers) for positive movement
    2. Analyzing network activity: daily active addresses and transaction count trends
    3. Running this analysis on multiple ERC20 token addresses at once

    For each token, you must:
    - Check for positive whale movement in the last 24 hours
    - Check if daily active addresses are increasing (last 7d vs previous 7d)
    - Check if transaction counts are increasing (last 7d vs previous 7d)
    - Summarize the results and provide a recommendation:
      - Bullish: Positive whale movement AND increasing network activity
      - Neutral: No whale movement but stable or increasing network activity
      - Cautious: No whale movement and decreasing network activity

    Always explain your reasoning for each recommendation.
    Only use onchain data for your analysis.
  `,
  model: openai("gpt-4o-mini"),
  tools: {
    analyzeOnchainTokenActivity,
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../../mastra.db",
    }),
  }),
});
