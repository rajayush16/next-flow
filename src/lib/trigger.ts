import { auth } from "@trigger.dev/sdk/v3";

import { env } from "@/lib/env";

export const triggerConfig = {
  projectId: env.TRIGGER_PROJECT_ID,
  secretKey: env.TRIGGER_SECRET_KEY,
};

if (env.TRIGGER_SECRET_KEY) {
  auth.configure({
    accessToken: env.TRIGGER_SECRET_KEY,
  });
}

export function isTriggerConfigured() {
  return Boolean(env.TRIGGER_SECRET_KEY && env.TRIGGER_PROJECT_ID);
}
