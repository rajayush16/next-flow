import { env } from "@/lib/env";

export const triggerConfig = {
  secretKey: env.TRIGGER_SECRET_KEY,
};

export function getTriggerClient() {
  // Placeholder for Trigger.dev initialization.
  return null;
}
