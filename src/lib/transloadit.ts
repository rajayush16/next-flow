import { Readable } from "node:stream";
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

export async function uploadBufferToTransloadit(args: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}) {
  const client = getTransloaditClient();

  if (!client) {
    return null;
  }

  const params = transloaditConfig.templateId
    ? { template_id: transloaditConfig.templateId }
    : {
        steps: {
          ":original": {
            robot: "/upload/handle",
            result: true,
          },
        },
      };

  const assembly = await client.createAssembly({
    uploads: {
      [args.fileName]: Readable.from(args.buffer),
    },
    params,
    waitForCompletion: true,
  });

  const originalResults = (assembly.results?.[":original"] ??
    assembly.results?.uploaded ??
    []) as Array<{
    ssl_url?: string;
    name?: string;
  }>;
  const asset = originalResults[0];

  if (!asset?.ssl_url) {
    throw new Error("Transloadit upload completed without a usable asset URL.");
  }

  return {
    fileName: asset.name ?? args.fileName,
    url: asset.ssl_url,
  };
}
