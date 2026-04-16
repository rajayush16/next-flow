import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "@/lib/env";

export function getGeminiClient() {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return null;
  }

  return new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
}
