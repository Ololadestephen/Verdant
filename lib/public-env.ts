import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().default("https://placeholder.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional().default("placeholder_key"),
  NEXT_PUBLIC_STARKNET_RPC_URL: z.string().url().optional().default("https://placeholder.rpc.url"),
  NEXT_PUBLIC_STARKNET_NETWORK: z.enum(["sepolia"]).optional().default("sepolia"),
  NEXT_PUBLIC_STARKNET_STAKING_CONTRACT: z.string().min(1).optional().default("0x0"),
  NEXT_PUBLIC_STARKNET_NFT_CONTRACT: z.string().min(1).optional().default("0x0")
});

const isBuild = process.env.npm_lifecycle_event === "build";

// Use explicit string references so Next.js Webpack can inline them at build time
const rawEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STARKNET_RPC_URL: process.env.NEXT_PUBLIC_STARKNET_RPC_URL,
  NEXT_PUBLIC_STARKNET_NETWORK: process.env.NEXT_PUBLIC_STARKNET_NETWORK,
  NEXT_PUBLIC_STARKNET_STAKING_CONTRACT: process.env.NEXT_PUBLIC_STARKNET_STAKING_CONTRACT,
  NEXT_PUBLIC_STARKNET_NFT_CONTRACT: process.env.NEXT_PUBLIC_STARKNET_NFT_CONTRACT
};

const parsed = PublicEnvSchema.safeParse(rawEnv);

if (!parsed.success && !isBuild && typeof window !== 'undefined') {
  console.error("❌ CRITICAL: Missing Vercel Environment Variables. The app will not function correctly.", parsed.error.format());
}

export const publicEnv = parsed.success ? parsed.data : {
  NEXT_PUBLIC_SUPABASE_URL: rawEnv.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key",
  NEXT_PUBLIC_STARKNET_RPC_URL: rawEnv.NEXT_PUBLIC_STARKNET_RPC_URL || "https://placeholder.rpc.url",
  NEXT_PUBLIC_STARKNET_NETWORK: (rawEnv.NEXT_PUBLIC_STARKNET_NETWORK as "sepolia") || "sepolia",
  NEXT_PUBLIC_STARKNET_STAKING_CONTRACT: rawEnv.NEXT_PUBLIC_STARKNET_STAKING_CONTRACT || "0x0",
  NEXT_PUBLIC_STARKNET_NFT_CONTRACT: rawEnv.NEXT_PUBLIC_STARKNET_NFT_CONTRACT || "0x0",
};
