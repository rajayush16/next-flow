import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  TRIGGER_SECRET_KEY: z.string().min(1).optional(),
  TRIGGER_PROJECT_ID: z.string().min(1).optional(),
  TRANSLOADIT_KEY: z.string().min(1).optional(),
  TRANSLOADIT_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success && process.env.NODE_ENV === "production") {
  throw new Error("Invalid environment configuration.");
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : envSchema.parse({ NODE_ENV: process.env.NODE_ENV });

export type Env = typeof env;
