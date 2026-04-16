import { env } from "@/lib/env";

export const triggerConfig = {
  projectId: env.TRIGGER_PROJECT_ID,
  secretKey: env.TRIGGER_SECRET_KEY,
};

export function getTriggerClient() {
  // Trigger.dev tasks are registered in the /trigger directory and
  // triggered from server actions and route handlers in later slices.
  return null;
}
