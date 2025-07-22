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
    const result = await (tokenFinder.tools?.getTrendingTokensWithAnalysis as any).execute({ 
      context: { 
        limit: 5,
        minScore: 20,
        days: 1,
        evm_only: true
      } 
    });
    return { tokenAddresses: result };
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
    amount: z.string(),
  }),
  suspendSchema: z.object({
    bestTokenAddress: z.string().min(42).max(42),
    message: z.string(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    // USDC address on Ethereum mainnet
    const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    if (!resumeData?.amount) {
      const message = `The trade will use USDC (Ethereum) as the source token.\nUSDC address: ${usdcAddress}\n\nRecommended Token: ${inputData.bestTokenAddress}\n\nPlease provide the amount of USDC you want to trade.`;
      await suspend({
        bestTokenAddress: inputData.bestTokenAddress,
        message,
      });
      return { fromToken: usdcAddress, amount: "", bestTokenAddress: inputData.bestTokenAddress };
    }
    return {
      fromToken: usdcAddress,
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
    
    // First, try to get a quote to validate the trade parameters
    try {
      const quote = await (recallAgent.tools?.getRecallTradeQuote as any).execute({
        context: {
          fromToken: inputData.fromToken,
          toToken: inputData.bestTokenAddress,
          amount: inputData.amount,
          fromChain: "ethereum", // USDC is on Ethereum
          toChain: "ethereum",   // Assuming target token is also on Ethereum
        },
      });
      console.log("Trade quote received:", quote);
    } catch (quoteError: unknown) {
      console.error("Quote error:", quoteError);
      const errorMessage = quoteError instanceof Error ? quoteError.message : String(quoteError);
      throw new Error(`Failed to get trade quote: ${errorMessage}`);
    }
    
    // Execute the trade with chain information
    const tradeResult = await (recallAgent.tools?.executeRecallTrade as any).execute({
      context: {
        fromToken: inputData.fromToken,
        toToken: inputData.bestTokenAddress,
        amount: inputData.amount,
        reason: "User-affirmed trade for token with highest growth potential",
        fromChain: "ethereum", // USDC is on Ethereum
        toChain: "ethereum",   // Assuming target token is also on Ethereum
        slippageTolerance: "1", // 1% slippage tolerance
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
