import { z } from "zod";

const optionalString = () =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().min(1).optional(),
  );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().url().optional(),
  ),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalString(),
  CLERK_SECRET_KEY: optionalString(),
  GOOGLE_GENERATIVE_AI_API_KEY: optionalString(),
  TRIGGER_SECRET_KEY: optionalString(),
  TRIGGER_PROJECT_ID: optionalString(),
  TRANSLOADIT_KEY: optionalString(),
  TRANSLOADIT_SECRET: optionalString(),
  NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID: optionalString(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success && process.env.NODE_ENV === "production") {
  throw new Error("Invalid environment configuration.");
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : envSchema.parse({ NODE_ENV: process.env.NODE_ENV });

export type Env = typeof env;
