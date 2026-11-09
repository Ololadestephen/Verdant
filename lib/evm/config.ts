import { defineChain } from "viem";

export const botChain = defineChain({
  id: 677,
  name: "BOT Chain",
  nativeCurrency: {
    decimals: 18,
    name: "BOT",
    symbol: "BOT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.botchain.ai"],
      webSocket: ["wss://ws-rpc.botchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "BotScan",
      url: "https://scan.botchain.ai",
    },
  },
});
