import { z } from "zod";

const ServerEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini")
});

const isBuild = process.env.npm_lifecycle_event === "build";

export const serverEnv = isBuild
  ? {
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "placeholder",
      OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4.1-mini"
    } as z.infer<typeof ServerEnvSchema>
  : ServerEnvSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL
    });

