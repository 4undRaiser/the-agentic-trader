# The Agentic Trader

An agentic trading workflow built with [Mastra](https://github.com/mastra-ai/mastra) that leverages multiple agents for trending token discovery, onchain analysis, portfolio management, and automated trading via the Recall Network.

## Features

- **Trending Token Discovery**: Finds trending tokens using a dedicated agent.
- **Onchain Analysis**: Analyzes token activity to select the best trading opportunity.
- **Portfolio Management**: Fetches and displays your current portfolio (Recall Network).
- **Automated Trade Execution**: Executes trades automatically using Recall's trading API.

## Prerequisites

- **Node.js** >= 20.9.0
- **npm**
- **Recall API Key** (see [Recall Network](https://competitions.recall.network/))
- (Optional) A funded wallet for live trading

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables (e.g., in a `.env` file or your shell):

```
RECALL_API_KEY=your_recall_api_key_here
RECALL_WALLET_PRIVATE_KEY=your_wallet_private_key_here
```

- `RECALL_API_KEY` is required for all Recall API operations.
- `RECALL_WALLET_PRIVATE_KEY` is only needed for executing live trades.

## Running the Project

- **Development mode:**
  ```bash
  npm run dev
  ```
- **Production build:**
  ```bash
  npm run build
  npm start
  ```

## Workflow Description

The main workflow (`agentic-trader-workflow`) consists of the following steps:

1. **Find Trending Tokens**: Uses the token finder agent to get a list of trending tokens.
2. **Onchain Analysis**: Analyzes these tokens to select the one with the highest growth potential.
3. **Get Portfolio & Ask**: (Now simplified) Always uses USDC on Ethereum as the source token, and prompts the user only for the amount to trade.
4. **Execute Trade**: Executes the trade from USDC to the selected token using Recall's trading API.

## Example Usage

1. Start the workflow (via your Mastra runner or integration).
2. When prompted, enter the amount of USDC you wish to trade.
3. The workflow will analyze trending tokens, select the best one, and execute the trade automatically.
4. Results and errors will be displayed in your terminal or UI.

## License

ISC
