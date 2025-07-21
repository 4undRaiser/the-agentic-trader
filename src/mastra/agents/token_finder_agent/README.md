# Token Finder Agent

A specialized AI agent that identifies trending EVM tokens with high growth potential by analyzing market data, historical prices, and growth patterns.

## Features

- **Trending Token Discovery**: Finds high-volume trending tokens from CoinGecko
- **Comprehensive Token Details**: Automatically fetches detailed information including ATH, ATL, and market data
- **Growth Potential Analysis**: Calculates comprehensive growth scores based on multiple factors
- **ATH/ATL Analysis**: Identifies tokens that haven't reached their all-time high yet
- **Momentum Tracking**: Analyzes recent price trends and volatility
- **Risk Assessment**: Provides risk analysis and recommendations

## Tools

### 1. Get Trending Tokens With Details

Fetches trending tokens with high 24h volume, positive price changes, and comprehensive detailed information including ATH, ATL, and market data.

**Parameters:**

- `limit` (optional): Number of tokens to return (default: 50)
- `platform` (optional): Platform to search (default: "ethereum")

**Returns:** Array of trending tokens with detailed information embedded in each token object.

### 2. Analyze Trending Tokens Growth Potential

Takes trending tokens with details as input and performs detailed analysis of their growth potential.

**Parameters:**

- `trendingTokensWithDetails`: Array of trending tokens with details from the Get Trending Tokens With Details tool
- `limit` (optional): Number of tokens to return (default: 10)
- `minScore` (optional): Minimum growth potential score (default: 50)
- `days` (optional): Days of historical data to analyze (default: 30)

## Workflow

The agent follows this streamlined workflow:

1. **Fetch Trending Tokens With Details**: Uses `getTrendingTokensWithDetails` to get high-volume trending tokens with comprehensive details
2. **Analyze Growth Potential**: Uses `analyzeTrendingTokensGrowthPotential` to analyze the fetched tokens

## Analysis Criteria

The agent evaluates tokens based on:

1. **Distance from ATH**: Tokens should be at least 20% below their all-time high
2. **Momentum**: Positive recent price trends (7-day momentum)
3. **Volume**: Sufficient trading volume (>$1M) for liquidity
4. **Volatility**: Reasonable volatility for growth potential
5. **Market Cap**: Optimal range between $5M-$500M

## Growth Potential Score (0-100)

The score is calculated based on:

- **Distance from ATH** (30 points max): Higher score for tokens far from ATH
- **Momentum** (25 points max): Higher score for positive recent trends
- **Volatility** (20 points max): Optimal volatility range
- **Volume** (15 points max): Higher score for better liquidity
- **Market Cap** (10 points max): Sweet spot for growth potential

## Usage Example

```typescript
import { tokenFinderAgent } from "./agents/token_finder_agent/token-finder-agent";

// Find trending tokens with high growth potential
const result = await tokenFinderAgent.run({
  messages: [
    {
      role: "user",
      content:
        "Find me the top 5 trending EVM tokens with the highest growth potential that haven't reached their ATH yet.",
    },
  ],
});
```

## Agent Workflow

The agent will:

1. Fetch trending tokens with comprehensive details using the `getTrendingTokensWithDetails` tool
2. Pass those tokens to the `analyzeTrendingTokensGrowthPotential` tool for analysis
3. Return a curated list of tokens with the highest growth potential scores
4. Provide detailed analysis and recommendations for each token

## Data Structure

The `getTrendingTokensWithDetails` tool returns tokens with this enhanced structure:

```typescript
{
  // Basic token info from markets endpoint
  id: string,
  name: string,
  symbol: string,
  current_price: number,
  market_cap: number,
  total_volume: number,
  price_change_percentage_24h: number,

  // Detailed information
  details: {
    ath: number,
    ath_date: string,
    atl: number,
    atl_date: string,
    price_change_percentage_7d: number,
    price_change_percentage_30d: number,
    circulating_supply: number,
    total_supply: number,
    max_supply: number,
    platforms: object,
    description: string,
    categories: string[],
    links: object
  }
}
```

## Risk Disclaimer

⚠️ **Important**: This agent provides analysis for educational and research purposes only. Cryptocurrency trading involves significant risk, and past performance does not guarantee future results. Always conduct your own research and consider consulting with financial advisors before making investment decisions.

## API Requirements

The agent requires a CoinGecko API key set in the `COINGECKO_API_KEY` environment variable.
