import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  // project: process.env.TRIGGER_PROJECT_ID ?? "",
  project: "proj_jidecmirjxflewwkizsy",
  runtime: "node",
  dirs: ["./trigger"],
  maxDuration: 300,
});
