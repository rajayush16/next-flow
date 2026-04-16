import { env } from "@/lib/env";

export const transloaditConfig = {
  key: env.TRANSLOADIT_KEY,
  secret: env.TRANSLOADIT_SECRET,
};

export function getTransloaditClient() {
  // Placeholder for Transloadit client/server setup.
  return null;
}
