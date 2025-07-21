import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";

import { tokenFinderAgent } from "./agents/token_finder_agent/token-finder-agent";
import { recallTradingAgent } from "./agents/recall_trading_agent/recall-trading-agent";
import { onchainAnalysisAgent } from "./agents/onchain_analysis_agent/onchain-analysis-agent";
import { agenticTraderWorkflow } from "./workflows/agentic-trader-workflow";


export const mastra = new Mastra({
  workflows: { agenticTraderWorkflow },
  agents: {
    onchainAnalysisAgent,
    tokenFinderAgent,
    recallTradingAgent,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
