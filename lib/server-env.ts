import { z } from "zod";

const ServerEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  STARKNET_ADMIN_ADDRESS: z.string().optional(),
  STARKNET_ADMIN_PRIVATE_KEY: z.string().optional()
});


const isBuild = process.env.npm_lifecycle_event === "build";

export const serverEnv = isBuild
  ? {
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "placeholder",
      OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      STARKNET_ADMIN_ADDRESS: process.env.STARKNET_ADMIN_ADDRESS,
      STARKNET_ADMIN_PRIVATE_KEY: process.env.STARKNET_ADMIN_PRIVATE_KEY
    } as z.infer<typeof ServerEnvSchema>
  : ServerEnvSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      STARKNET_ADMIN_ADDRESS: process.env.STARKNET_ADMIN_ADDRESS,
      STARKNET_ADMIN_PRIVATE_KEY: process.env.STARKNET_ADMIN_PRIVATE_KEY
    });


