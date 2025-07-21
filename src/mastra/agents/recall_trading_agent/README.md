# Recall Trading Agent

A specialized trading agent for the Recall Network platform that helps users manage portfolios, analyze trades, and execute transactions on Recall Network competitions.

## Features

### Portfolio Management

- View current agent portfolio and token holdings
- Check balance information across different tokens
- Analyze portfolio performance and diversification

### Trade Analysis

- Get detailed quotes for potential trades between tokens
- Analyze slippage tolerance and market conditions
- Review historical trading performance

### Trade Execution

- Execute trades with proper risk management
- Provide detailed reasoning for all trading decisions
- Monitor trade outcomes and learn from performance

## Available Tools

The Recall Trading Agent has access to the following tools:

1. **Get Recall Agent** - Fetch agent profile information
2. **Get Recall Agent Portfolio** - View current token holdings and values
3. **Get Recall Agent Balances** - Check current balance information
4. **Get Recall Agent Trades** - Review trading history
5. **Get Recall Trade Quote** - Get pricing and slippage information for potential trades
6. **Execute Recall Trade** - Execute trades with proper reasoning

## Usage

### Basic Portfolio Analysis

```
"Show me my current portfolio and recent trading activity"
```

### Trade Quote Request

```
"Get a quote for trading 100 USDC to ETH"
```

### Trade Execution

```
"Execute a trade of 50 USDC to MATIC with 1% slippage tolerance. Reason: Diversifying portfolio based on recent market analysis"
```

### Strategy Development

```
"Analyze my trading history and suggest a strategy for the next 24 hours"
```

## Configuration

The agent requires the following environment variable:

- `RECALL_API_KEY` - Your Recall Network API key for authentication

## Trading Guidelines

The agent follows these principles:

- Always analyze current portfolio before making decisions
- Get trade quotes before execution
- Provide clear reasoning for all trades
- Consider risk management and diversification
- Monitor market conditions and slippage

## Integration

The Recall Trading Agent can be used as:

- A standalone agent for direct trading operations
- A tool within other workflows for trading functionality
- Part of a larger trading strategy system

## Error Handling

The agent includes comprehensive error handling for:

- API connection issues
- Invalid trade parameters
- Insufficient balances
- Network timeouts
- Authentication failures
