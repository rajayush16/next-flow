import { Readable } from "node:stream";
import { NextResponse } from "next/server";

import { getTransloaditClient, transloaditConfig } from "@/lib/transloadit";

export const runtime = "nodejs";

function guessOutputType(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "file";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  const client = getTransloaditClient();

  if (!client) {
    return NextResponse.json(
      { error: "Transloadit is not configured on this environment." },
      { status: 503 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

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
      [file.name]: Readable.from(buffer),
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
    return NextResponse.json(
      { error: "Transloadit upload completed without a usable asset URL." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    fileName: asset.name ?? file.name,
    mimeType: file.type,
    provider: "transloadit",
    type: guessOutputType(file.type),
    url: asset.ssl_url,
  });
}
