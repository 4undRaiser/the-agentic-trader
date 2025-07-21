import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getTrendingTokensWithDetails = createTool({
  id: "Get trending tokens with details",
  inputSchema: z.object({ 
    limit: z.number().optional().default(50),
    include_categories: z.boolean().optional().default(false),
    evm_only: z.boolean().optional().default(true)
  }),
  description: "Get trending ERC-20 tokens from CoinGecko using the trending search API with detailed information including ATH, ATL, and market data. Only returns tokens with contract addresses on EVM-compatible chains.",
  execute: async ({ context }) => {
    const { limit, include_categories, evm_only } = context;
    
    // Use the CoinGecko trending search API endpoint
    const url = "https://api.coingecko.com/api/v3/search/trending";

    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": process.env.COINGECKO_API_KEY!,
      },
    };

    const response = await fetch(url, options);
    const data = await response.json();

    console.log(`Fetched trending data from CoinGecko API`);
    console.log(`Found ${data.coins?.length || 0} trending coins`);
    if (include_categories && data.categories) {
      console.log(`Found ${data.categories.length} trending categories`);
    }

    // Extract trending coins from the response
    const trendingCoins = data.coins || [];
    console.log(`Processing ${trendingCoins.length} trending coins`);

    // Get detailed information for each trending token
    const tokensWithDetails = [];
    
    for (const coin of trendingCoins.slice(0, limit)) {
      try {
        const coinData = coin.item;
        console.log(`Getting details for trending coin: ${coinData.name} (${coinData.symbol})`);
        
        // Get detailed coin information using the coin ID
        const detailsUrl = `https://api.coingecko.com/api/v3/coins/${coinData.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
        const detailsResponse = await fetch(detailsUrl, options);
        const tokenDetails = await detailsResponse.json();

        // Extract contract addresses from platforms
        const contractAddresses: { [platform: string]: string } = {};
        if (tokenDetails.platforms) {
          Object.entries(tokenDetails.platforms).forEach(([platform, address]) => {
            if (address && typeof address === 'string') {
              contractAddresses[platform] = address;
            }
          });
        }

        // Check if this is an ERC-20 token (has contract address on EVM chains)
        const evmChains = [
          'ethereum', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one', 
          'optimistic-ethereum', 'avalanche', 'fantom', 'cronos', 'base',
          'polygon-zkevm', 'mantle', 'linea', 'scroll', 'zksync-era'
        ];
        
        const hasEVMAddress = evmChains.some(chain => contractAddresses[chain]);
        
        // Skip non-ERC-20 tokens if evm_only is true
        if (evm_only && !hasEVMAddress) {
          console.log(`✗ Skipped ${coinData.symbol} - No EVM contract address found`);
          continue;
        }

        const enhancedToken = {
          id: coinData.id,
          name: coinData.name,
          symbol: coinData.symbol,
          market_cap_rank: coinData.market_cap_rank,
          score: coinData.score,
          trending_rank: coinData.score, // Use score as trending rank
          price_btc: coinData.price_btc,
          contract_addresses: contractAddresses,
          is_erc20: hasEVMAddress,
          evm_chains: evmChains.filter(chain => contractAddresses[chain]),
          details: {
            id: tokenDetails.id,
            name: tokenDetails.name,
            symbol: tokenDetails.symbol,
            current_price: tokenDetails.market_data?.current_price?.usd,
            ath: tokenDetails.market_data?.ath?.usd,
            ath_date: tokenDetails.market_data?.ath_date?.usd,
            atl: tokenDetails.market_data?.atl?.usd,
            atl_date: tokenDetails.market_data?.atl_date?.usd,
            market_cap: tokenDetails.market_data?.market_cap?.usd,
            total_volume: tokenDetails.market_data?.total_volume?.usd,
            price_change_24h: tokenDetails.market_data?.price_change_24h,
            price_change_percentage_24h: tokenDetails.market_data?.price_change_percentage_24h,
            price_change_percentage_7d: tokenDetails.market_data?.price_change_percentage_7d,
            price_change_percentage_30d: tokenDetails.market_data?.price_change_percentage_30d,
            circulating_supply: tokenDetails.market_data?.circulating_supply,
            total_supply: tokenDetails.market_data?.total_supply,
            max_supply: tokenDetails.market_data?.max_supply,
            platforms: tokenDetails.platforms,
            contract_addresses: contractAddresses,
            description: tokenDetails.description?.en,
            categories: tokenDetails.categories,
            links: tokenDetails.links,
            image: tokenDetails.image,
            thumb: tokenDetails.image,
            small: tokenDetails.image,
            large: tokenDetails.image,
          }
        };

        tokensWithDetails.push(enhancedToken);
        console.log(`✓ Successfully processed ${coinData.symbol} (trending score: ${coinData.score}) - ERC-20: ${hasEVMAddress ? 'Yes' : 'No'}`);
      } catch (error) {
        console.log(`Error getting details for trending coin ${coin.item?.id}:`, error);
        // Still include the basic trending coin info if details fail, but only if it's an ERC-20
        if (coin.item) {
          // For fallback, we can't determine if it's ERC-20 without details, so skip if evm_only is true
          if (!evm_only) {
            tokensWithDetails.push({
              id: coin.item.id,
              name: coin.item.name,
              symbol: coin.item.symbol,
              market_cap_rank: coin.item.market_cap_rank,
              score: coin.item.score,
              trending_rank: coin.item.score,
              price_btc: coin.item.price_btc,
              contract_addresses: {},
              is_erc20: false,
              evm_chains: [],
              details: null
            });
          }
        }
      }
    }

    // Add trending categories if requested
    if (include_categories && data.categories) {
      const categoriesWithDetails = data.categories.map((category: any) => ({
        id: category.id,
        name: category.name,
        market_cap: category.market_cap,
        market_cap_change_24h: category.market_cap_change_24h,
        content: category.content,
        top_3_coins: category.top_3_coins,
        volume_24h: category.volume_24h,
        updated_at: category.updated_at,
        type: 'category'
      }));
      
      console.log(`Included ${categoriesWithDetails.length} trending categories`);
      tokensWithDetails.push(...categoriesWithDetails);
    }

    console.log(`Successfully processed ${tokensWithDetails.length} trending items with details (ERC-20 only: ${evm_only})`);
    return tokensWithDetails;
  },
});

// Helper function to get contract address for a specific platform
export const getContractAddressForPlatform = (token: any, platform: string): string | null => {
  const contractAddresses = token.contract_addresses || token.details?.contract_addresses || {};
  return contractAddresses[platform] || null;
};

// Helper function to get all contract addresses for a token
export const getAllContractAddresses = (token: any): { [platform: string]: string } => {
  return token.contract_addresses || token.details?.contract_addresses || {};
};

// Helper function to get the primary EVM contract address (prioritizes Ethereum)
export const getPrimaryEVMAddress = (token: any): string | null => {
  const contractAddresses = getAllContractAddresses(token);
  
  // Priority order for EVM chains
  const priorityChains = [
    'ethereum', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one',
    'optimistic-ethereum', 'avalanche', 'base', 'polygon-zkevm'
  ];
  
  for (const chain of priorityChains) {
    if (contractAddresses[chain]) {
      return contractAddresses[chain];
    }
  }
  
  // If no priority chain found, return the first available EVM address
  const evmChains = [
    'ethereum', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one', 
    'optimistic-ethereum', 'avalanche', 'fantom', 'cronos', 'base',
    'polygon-zkevm', 'mantle', 'linea', 'scroll', 'zksync-era'
  ];
  
  for (const chain of evmChains) {
    if (contractAddresses[chain]) {
      return contractAddresses[chain];
    }
  }
  
  return null;
};

// Helper function to check if a token is ERC-20
export const isERC20Token = (token: any): boolean => {
  return token.is_erc20 === true || getPrimaryEVMAddress(token) !== null;
};

// Helper function to get all EVM chains where a token is deployed
export const getEVMChains = (token: any): string[] => {
  return token.evm_chains || [];
};

export const analyzeTrendingTokensGrowthPotential = createTool({
  id: "Analyze trending tokens growth potential",
  inputSchema: z.object({ 
    trendingTokensWithDetails: z.array(z.object({
      id: z.string(),
      name: z.string(),
      symbol: z.string(),
      score: z.number().optional(),
      trending_rank: z.number().optional(),
      market_cap_rank: z.number().optional(),
      contract_addresses: z.record(z.string()).optional(),
      is_erc20: z.boolean().optional(),
      evm_chains: z.array(z.string()).optional(),
      details: z.any().optional(),
    })),
    limit: z.number().optional().default(10),
    minScore: z.number().optional().default(20),
    days: z.number().optional().default(1)
  }),
  description: "Analyze the growth potential of trending tokens by calculating comprehensive scores and metrics using the detailed token information and trending data",
  execute: async ({ context }) => {
    const { trendingTokensWithDetails, limit, minScore, days } = context;
    
    console.log(`Received ${trendingTokensWithDetails.length} trending tokens for analysis`);
    console.log(`Analysis parameters: limit=${limit}, minScore=${minScore}, days=${days}`);
    
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": process.env.COINGECKO_API_KEY!,
      },
    };

    // Filter out categories and only analyze coins
    const filteredTokens = trendingTokensWithDetails.filter((token: any) => token.type !== 'category');
    console.log(`Analyzing ${filteredTokens.length} trending coins (excluding categories)`);

    // Analyze each token's growth potential
    const analyzedTokens = [];
    
    for (const token of filteredTokens.slice(0, 20)) { // Analyze top 20 to avoid rate limits
      console.log(`Analyzing trending token: ${token.name} (${token.symbol})`);
      try {
        // Get historical prices for analysis
        const historicalUrl = `https://api.coingecko.com/api/v3/coins/${token.id}/market_chart?vs_currency=usd&days=${days}`;
        const historicalResponse = await fetch(historicalUrl, options);
        const historicalData = await historicalResponse.json();

        const prices = historicalData.prices.map((price: number[]) => ({
          timestamp: price[0],
          price: price[1],
        }));

        // Use the detailed information we already have
        const tokenDetails = token.details || token;
        const currentPrice = tokenDetails.current_price || tokenDetails.market_data?.current_price?.usd;
        const ath = tokenDetails.ath || tokenDetails.market_data?.ath?.usd;
        const atl = tokenDetails.atl || tokenDetails.market_data?.atl?.usd;

        // Calculate growth metrics
        const distanceFromATH = ath ? ((ath - currentPrice) / ath) * 100 : 0;
        const distanceFromATL = atl ? ((currentPrice - atl) / atl) * 100 : 0;
        
        // Calculate volatility (standard deviation of price changes)
        const priceChanges = [];
        for (let i = 1; i < prices.length; i++) {
          const change = ((prices[i].price - prices[i-1].price) / prices[i-1].price) * 100;
          priceChanges.push(change);
        }
        
        const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
        const variance = priceChanges.reduce((a, b) => a + Math.pow(b - avgChange, 2), 0) / priceChanges.length;
        const volatility = Math.sqrt(variance);

        // Calculate momentum (recent price trend)
        const recentPrices = prices.slice(-7); // Last 7 days
        const momentum = recentPrices.length > 1 ? 
          ((recentPrices[recentPrices.length - 1].price - recentPrices[0].price) / recentPrices[0].price) * 100 : 0;

        // Enhanced growth potential score (0-100) - Now includes trending score
        let growthPotentialScore = 0;
        
        // Base score for trending tokens (they're already trending!)
        growthPotentialScore += 25;
        
        // Add trending score bonus (CoinGecko trending score is typically 0-100)
        const trendingScore = token.score || token.trending_rank || 0;
        growthPotentialScore += Math.min(trendingScore * 0.3, 20); // Max 20 points from trending score
        
        // Higher score if far from ATH (more room to grow)
        if (distanceFromATH > 50) growthPotentialScore += 20;
        else if (distanceFromATH > 30) growthPotentialScore += 15;
        else if (distanceFromATH > 10) growthPotentialScore += 10;
        else if (distanceFromATH > 0) growthPotentialScore += 5;
        
        // Higher score if good momentum
        if (momentum > 20) growthPotentialScore += 15;
        else if (momentum > 10) growthPotentialScore += 12;
        else if (momentum > 0) growthPotentialScore += 8;
        else if (momentum > -10) growthPotentialScore += 3;
        
        // Higher score if reasonable volatility (not too stable, not too volatile)
        if (volatility > 5 && volatility < 20) growthPotentialScore += 10;
        else if (volatility > 3 && volatility < 30) growthPotentialScore += 8;
        else if (volatility > 1) growthPotentialScore += 5;
        
        // Higher score if good volume
        const volume24h = tokenDetails.total_volume || tokenDetails.market_data?.total_volume?.usd;
        if (volume24h > 10000000) growthPotentialScore += 10; // >$10M volume
        else if (volume24h > 1000000) growthPotentialScore += 8; // >$1M volume
        else if (volume24h > 100000) growthPotentialScore += 5; // >$100K volume
        else if (volume24h > 50000) growthPotentialScore += 3; // >$50K volume

        // Bonus for good market cap rank
        const marketCapRank = token.market_cap_rank;
        if (marketCapRank && marketCapRank <= 100) growthPotentialScore += 5;
        else if (marketCapRank && marketCapRank <= 500) growthPotentialScore += 3;
        else if (marketCapRank && marketCapRank <= 1000) growthPotentialScore += 1;

        const analysis = {
          tokenId: token.id,
          tokenName: tokenDetails.name || token.name,
          symbol: tokenDetails.symbol || token.symbol,
          currentPrice,
          ath,
          atl,
          distanceFromATH: Math.round(distanceFromATH * 100) / 100,
          distanceFromATL: Math.round(distanceFromATL * 100) / 100,
          volatility: Math.round(volatility * 100) / 100,
          momentum: Math.round(momentum * 100) / 100,
          growthPotentialScore: Math.round(growthPotentialScore),
          trendingScore: trendingScore,
          marketCapRank: marketCapRank,
          volume24h,
          marketCap: tokenDetails.market_cap || tokenDetails.market_data?.market_cap?.usd,
          priceChange24h: tokenDetails.price_change_percentage_24h || tokenDetails.market_data?.price_change_percentage_24h,
          analysis: {
            hasRoomToGrow: distanceFromATH > 20,
            hasGoodMomentum: momentum > 10,
            hasReasonableVolatility: volatility > 3 && volatility < 25,
            hasGoodVolume: volume24h > 1000000,
            isTrending: trendingScore > 50,
            recommendation: growthPotentialScore > 70 ? "High Potential" : 
                           growthPotentialScore > 50 ? "Medium Potential" : "Low Potential"
          },
          contract_addresses: token.contract_addresses || tokenDetails.contract_addresses
        };
        
        console.log(`Token ${token.symbol} - Score: ${analysis.growthPotentialScore}, Trending: ${trendingScore}, Min Score: ${minScore}`);
        if (analysis.growthPotentialScore >= minScore) {
          analyzedTokens.push({
            ...token,
            analysis,
            // Ensure contract addresses are preserved in the final result
            contract_addresses: token.contract_addresses || tokenDetails.contract_addresses || {},
            is_erc20: token.is_erc20 || false,
            evm_chains: token.evm_chains || []
          });
          console.log(`✓ Added ${token.symbol} to results (score: ${analysis.growthPotentialScore})`);
        } else {
          console.log(`✗ Skipped ${token.symbol} (score: ${analysis.growthPotentialScore} < ${minScore})`);
        }
      } catch (error) {
        console.log(`Error analyzing token ${token.id}:`, error);
        continue;
      }
    }

    console.log(`Analysis complete. Found ${analyzedTokens.length} tokens meeting criteria.`);
    
    // Sort by growth potential score and return top results
    const finalResults = analyzedTokens
      .sort((a, b) => b.analysis.growthPotentialScore - a.analysis.growthPotentialScore)
      .slice(0, limit);
    
    console.log(`Returning top ${finalResults.length} tokens with highest scores.`);
    // Return only the ERC-20 contract addresses (prioritize Ethereum, fallback to first EVM address)
    const erc20Addresses = finalResults.map(token => {
      const contractAddresses = token.contract_addresses || token.details?.contract_addresses || {};
      // Priority: Ethereum, then any EVM chain
      return contractAddresses['ethereum'] || Object.values(contractAddresses)[0] || null;
    }).filter(addr => !!addr);
    return erc20Addresses;
  },
}); 