import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STARKNET_RPC_URL: z.string().url(),
  NEXT_PUBLIC_STARKNET_NETWORK: z.enum(["sepolia"]),
  NEXT_PUBLIC_STARKNET_STAKING_CONTRACT: z.string().min(1),
  NEXT_PUBLIC_STARKNET_NFT_CONTRACT: z.string().min(1)
});

const isBuild = process.env.npm_lifecycle_event === "build";

export const publicEnv = isBuild 
  ? {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder",
      NEXT_PUBLIC_STARKNET_RPC_URL: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || "https://placeholder.rpc",
      NEXT_PUBLIC_STARKNET_NETWORK: process.env.NEXT_PUBLIC_STARKNET_NETWORK || "sepolia",
      NEXT_PUBLIC_STARKNET_STAKING_CONTRACT: process.env.NEXT_PUBLIC_STARKNET_STAKING_CONTRACT || "0x0",
      NEXT_PUBLIC_STARKNET_NFT_CONTRACT: process.env.NEXT_PUBLIC_STARKNET_NFT_CONTRACT || "0x0",
    } as z.infer<typeof PublicEnvSchema>
  : PublicEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_STARKNET_RPC_URL: process.env.NEXT_PUBLIC_STARKNET_RPC_URL,
      NEXT_PUBLIC_STARKNET_NETWORK: process.env.NEXT_PUBLIC_STARKNET_NETWORK,
      NEXT_PUBLIC_STARKNET_STAKING_CONTRACT: process.env.NEXT_PUBLIC_STARKNET_STAKING_CONTRACT,
      NEXT_PUBLIC_STARKNET_NFT_CONTRACT: process.env.NEXT_PUBLIC_STARKNET_NFT_CONTRACT
    });

