import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const findTrendingTokensStep = createStep({
  id: "find-trending-tokens",
  inputSchema: z.object({}),
  outputSchema: z.object({
    tokenAddresses: z.array(z.string().min(42).max(42)),
  }),
  execute: async ({ mastra }) => {
    const tokenFinder = mastra.getAgent("tokenFinderAgent");
    const result = await (tokenFinder.tools?.getTrendingTokensWithDetails as any).execute({ context: { limit: 20 } });
    const analyzed = await (tokenFinder.tools?.analyzeTrendingTokensGrowthPotential as any).execute({
      context: {
        trendingTokensWithDetails: result,
        limit: 5,
        minScore: 20,
      },
    });
    return { tokenAddresses: analyzed };
  },
});

const onchainAnalysisStep = createStep({
  id: "onchain-analysis",
  inputSchema: z.object({
    tokenAddresses: z.array(z.string().min(42).max(42)),
  }),
  outputSchema: z.object({
    bestTokenAddress: z.string().min(42).max(42),
  }),
  execute: async ({ inputData, mastra }) => {
    const onchainAgent = mastra.getAgent("onchainAnalysisAgent");
    const bestTokenAddress = await (onchainAgent.tools?.analyzeOnchainTokenActivity as any).execute({
      context: {
        tokenAddresses: inputData.tokenAddresses,
      },
    });
    return { bestTokenAddress };
  },
});

const getPortfolioAndAskStep = createStep({
  id: "get-portfolio-and-ask",
  inputSchema: z.object({
    bestTokenAddress: z.string().min(42).max(42),
  }),
  outputSchema: z.object({
    fromToken: z.string().min(42).max(42),
    amount: z.string(),
    bestTokenAddress: z.string().min(42).max(42),
  }),
  resumeSchema: z.object({
    fromToken: z.string().min(42).max(42),
    amount: z.string(),
  }),
  suspendSchema: z.object({
    portfolio: z.any(),
    bestTokenAddress: z.string().min(42).max(42),
  }),
  execute: async ({ inputData, mastra, resumeData, suspend }) => {
    const recallAgent = mastra.getAgent("recallTradingAgent");
    const portfolio = await (recallAgent.tools?.getRecallAgentPortfolio as any).execute({ context: {} });
    if (!resumeData?.fromToken || !resumeData?.amount) {
      await suspend({ portfolio, bestTokenAddress: inputData.bestTokenAddress });
      return { fromToken: "", amount: "", bestTokenAddress: inputData.bestTokenAddress };
    }
    return {
      fromToken: resumeData.fromToken,
      amount: resumeData.amount,
      bestTokenAddress: inputData.bestTokenAddress,
    };
  },
});

const executeTradeStep = createStep({
  id: "execute-trade",
  inputSchema: z.object({
    fromToken: z.string().min(42).max(42),
    amount: z.string(),
    bestTokenAddress: z.string().min(42).max(42),
  }),
  outputSchema: z.object({
    tradeResult: z.any(),
  }),
  execute: async ({ inputData, mastra }) => {
    const recallAgent = mastra.getAgent("recallTradingAgent");
    // Optionally get a quote first (not required for execution)
    // const quote = await (recallAgent.tools?.getRecallTradeQuote as any).execute({
    //   context: {
    //     fromToken: inputData.fromToken,
    //     toToken: inputData.bestTokenAddress,
    //     amount: inputData.amount,
    //   },
    // });
    const tradeResult = await (recallAgent.tools?.executeRecallTrade as any).execute({
      context: {
        fromToken: inputData.fromToken,
        toToken: inputData.bestTokenAddress,
        amount: inputData.amount,
        reason: "User-affirmed trade for token with highest growth potential",
      },
    });
    return { tradeResult };
  },
});

const agenticTraderWorkflow = createWorkflow({
  id: "agentic-trader-workflow",
  inputSchema: z.object({}),
  outputSchema: z.object({
    tradeResult: z.any(),
  }),
})
  .then(findTrendingTokensStep)
  .then(onchainAnalysisStep)
  .then(getPortfolioAndAskStep)
  .then(executeTradeStep);

agenticTraderWorkflow.commit();

export { agenticTraderWorkflow, getPortfolioAndAskStep };
