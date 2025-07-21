import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Alchemy, Network } from "alchemy-sdk";

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY!,
  network: Network.ETH_MAINNET,
});

export const analyzeOnchainTokenActivity = createTool({
  id: "Analyze Onchain Token Activity",
  inputSchema: z.object({
    tokenAddresses: z.array(z.string().min(42).max(42)).describe("Array of ERC20 token contract addresses (Ethereum mainnet)"),
  }),
  description:
    "Return the address of the ERC20 token with the most potential for growth based on whale movement and network activity using Alchemy SDK.",
  outputSchema: z.string(),
  execute: async ({ context }) => {
    const { tokenAddresses } = context;
    const now = Math.floor(Date.now() / 1000);
    const oneDay = 24 * 60 * 60;

    async function getWhaleTransfers(tokenAddress: string) {
      try {
        const transfers = await alchemy.core.getAssetTransfers({
          fromBlock: "latest",
          toBlock: "latest",
          contractAddresses: [tokenAddress],
          category: ["erc20" as any],
          maxCount: 100,
        });
        const whaleTxs = [];
        for (const tx of transfers.transfers) {
          const value = Number(tx.value || "0");
          if (value > 100_000 * 1e18) {
            const block = await alchemy.core.getBlock(Number(tx.blockNum));
            const blockTimestamp = block.timestamp;
            if ((now - blockTimestamp) < oneDay) {
              whaleTxs.push(tx);
            }
          }
        }
        return whaleTxs.length > 0;
      } catch (error) {
        return false;
      }
    }

    async function getAddressAndTxTrends(tokenAddress: string) {
      try {
        const endBlock = await alchemy.core.getBlockNumber();
        const startBlock = endBlock - 14 * 7200;
        const logs = await alchemy.core.getLogs({
          address: tokenAddress,
          fromBlock: `0x${startBlock.toString(16)}`,
          toBlock: `0x${endBlock.toString(16)}`,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          ],
        });
        // Group logs by day
        const byDay: Record<string, { addresses: Set<string>; txs: Set<string> }> = {};
        for (const log of logs) {
          const block = await alchemy.core.getBlock(Number(log.blockNumber));
          const day = new Date(block.timestamp * 1000).toISOString().slice(0, 10);
          if (!byDay[day]) byDay[day] = { addresses: new Set(), txs: new Set() };
          byDay[day].addresses.add(log.topics[1]);
          byDay[day].txs.add(log.transactionHash);
        }
        const days = Object.keys(byDay).sort();
        const last7 = days.slice(-7);
        const prev7 = days.slice(-14, -7);
        const current7dAddresses = last7.reduce((sum, d) => sum + byDay[d].addresses.size, 0);
        const prev7dAddresses = prev7.reduce((sum, d) => sum + byDay[d].addresses.size, 0);
        const current7dTxs = last7.reduce((sum, d) => sum + byDay[d].txs.size, 0);
        const prev7dTxs = prev7.reduce((sum, d) => sum + byDay[d].txs.size, 0);
        return {
          addressesIncreasing: current7dAddresses > prev7dAddresses,
          txsIncreasing: current7dTxs > prev7dTxs,
          addressDelta: current7dAddresses - prev7dAddresses,
          txDelta: current7dTxs - prev7dTxs,
        };
      } catch (error) {
        return {
          addressesIncreasing: false,
          txsIncreasing: false,
          addressDelta: 0,
          txDelta: 0,
        };
      }
    }

    // Gather analysis for all tokens
    const analysis = [];
    for (const tokenAddress of tokenAddresses) {
      const whale = await getWhaleTransfers(tokenAddress);
      const trends = await getAddressAndTxTrends(tokenAddress);
      analysis.push({
        tokenAddress,
        whale,
        ...trends,
      });
    }

    // 1. Prefer tokens with whale movement AND both metrics increasing
    let candidates = analysis.filter(a => a.whale && a.addressesIncreasing && a.txsIncreasing);
    if (candidates.length > 0) return candidates[0].tokenAddress;
    // 2. Prefer tokens with whale movement and at least one metric increasing
    candidates = analysis.filter(a => a.whale && (a.addressesIncreasing || a.txsIncreasing));
    if (candidates.length > 0) return candidates[0].tokenAddress;
    // 3. Otherwise, return the token with the highest combined delta
    let best = analysis[0];
    let bestScore = (best?.addressDelta || 0) + (best?.txDelta || 0);
    for (const a of analysis) {
      const score = (a.addressDelta || 0) + (a.txDelta || 0);
      if (score > bestScore) {
        best = a;
        bestScore = score;
      }
    }
    return best.tokenAddress;
  },
});
