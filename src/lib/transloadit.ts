import { env } from "@/lib/env";

export const transloaditConfig = {
  key: env.TRANSLOADIT_KEY,
  secret: env.TRANSLOADIT_SECRET,
  templateId: env.NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID,
};

export function getTransloaditClient() {
  // The official Transloadit SDK is wired in the upload route slice.
  return null;
}
