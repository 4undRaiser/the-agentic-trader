import { MCPClient } from "@mastra/mcp";

// Configure MCPClient to connect to your server(s)
export const mcp = new MCPClient({
  servers: {
    recall: {
      command: "npx",
      args: [
        "-y",
        "/Users/shanethomas/dev/kepler/mcps/js-recall/packages/api-mcp/dist/index.js",
      ],
      env: {
        API_KEY: process.env.RECALL_API_KEY || "",
        //API_SERVER_URL: "https://api.competitions.recall.network",
        API_SERVER_URL: "https://api.sandbox.competitions.recall.network",
        WALLET_PRIVATE_KEY: process.env.RECALL_WALLET_PRIVATE_KEY || "",
        LOG_LEVEL: "info",
      },
    },
  },
});
