import { defineConfig } from "@trigger.dev/sdk/v3";
import { ffmpeg } from "@trigger.dev/build/extensions/core";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID ?? "proj_jidecmirjxflewwkizsy",
  runtime: "node",
  dirs: ["./trigger"],
  maxDuration: 300,
  build: {
    extensions: [
      ffmpeg({ version: "7" }),
      prismaExtension({
        mode: "legacy",
        schema: "prisma/schema.prisma",
      }),
    ],
  },
});
