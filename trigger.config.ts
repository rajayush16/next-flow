import { defineConfig } from "@trigger.dev/sdk/v3";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID ?? "proj_jidecmirjxflewwkizsy",
  runtime: "node",
  dirs: ["./trigger"],
  maxDuration: 300,
  build: {
    extensions: [
      prismaExtension({
        schema: "prisma/schema.prisma",
      }),
    ],
  },
});
