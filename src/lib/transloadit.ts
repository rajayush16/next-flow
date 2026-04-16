import { Transloadit } from "transloadit";

import { env } from "@/lib/env";

export const transloaditConfig = {
  key: env.TRANSLOADIT_KEY,
  secret: env.TRANSLOADIT_SECRET,
  templateId: env.NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID,
};

export function getTransloaditClient() {
  if (!transloaditConfig.key || !transloaditConfig.secret) {
    return null;
  }

  return new Transloadit({
    authKey: transloaditConfig.key,
    authSecret: transloaditConfig.secret,
  });
}

export function isTransloaditConfigured() {
  return Boolean(transloaditConfig.key && transloaditConfig.secret);
}
