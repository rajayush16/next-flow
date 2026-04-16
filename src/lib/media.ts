import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";

import { uploadBufferToTransloadit } from "@/lib/transloadit";

const execFileAsync = promisify(execFile);

function extensionFromMimeType(mimeType: string) {
  if (mimeType.includes("png")) {
    return ".png";
  }

  if (mimeType.includes("webp")) {
    return ".webp";
  }

  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return ".jpg";
  }

  if (mimeType.includes("mp4")) {
    return ".mp4";
  }

  if (mimeType.includes("mov")) {
    return ".mov";
  }

  return "";
}

function mimeTypeFromExtension(extension: string) {
  switch (extension) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    default:
      return "image/jpeg";
  }
}

function parseDataUrl(input: string) {
  const match = input.match(/^data:(.+?);base64,(.+)$/);

  if (!match) {
    return null;
  }

  const mimeType = match[1];
  const base64Data = match[2];

  if (!mimeType || !base64Data) {
    return null;
  }

  return {
    mimeType,
    buffer: Buffer.from(base64Data, "base64"),
  };
}

export async function materializeAssetInput(input: string, filePrefix: string) {
  const tempDir = await mkdtemp(join(tmpdir(), "nextflow-"));

  if (input.startsWith("data:")) {
    const parsed = parseDataUrl(input);

    if (!parsed) {
      throw new Error("Unsupported inline asset payload.");
    }

    const extension = extensionFromMimeType(parsed.mimeType) || ".bin";
    const inputPath = join(tempDir, `${filePrefix}${extension}`);
    await writeFile(inputPath, parsed.buffer);

    return {
      inputPath,
      tempDir,
      mimeType: parsed.mimeType,
    };
  }

  const response = await fetch(input);

  if (!response.ok) {
    throw new Error(`Unable to fetch asset: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const mimeType = response.headers.get("content-type") ?? "application/octet-stream";
  const urlExtension = extname(new URL(input).pathname);
  const inputPath = join(
    tempDir,
    `${filePrefix}${urlExtension || extensionFromMimeType(mimeType) || ".bin"}`,
  );
  await writeFile(inputPath, buffer);

  return {
    inputPath,
    tempDir,
    mimeType,
  };
}

export async function cleanupTempDir(tempDir: string) {
  await rm(tempDir, {
    force: true,
    recursive: true,
  });
}

export async function runFfmpeg(args: string[]) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static is not available.");
  }

  await execFileAsync(ffmpegPath, args);
}

export async function getVideoDurationInSeconds(videoPath: string) {
  if (!ffprobe.path) {
    return null;
  }

  const { stdout } = await execFileAsync(ffprobe.path, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    videoPath,
  ]);
  const parsed = Number.parseFloat(stdout.trim());

  return Number.isFinite(parsed) ? parsed : null;
}

export async function storeProcessedAsset(args: {
  outputPath: string;
  fileName: string;
  mimeType?: string;
}) {
  const buffer = await readFile(args.outputPath);
  const mimeType = args.mimeType ?? mimeTypeFromExtension(extname(args.outputPath));
  const uploaded = await uploadBufferToTransloadit({
    buffer,
    fileName: args.fileName,
    mimeType,
  });

  if (uploaded) {
    return uploaded.url;
  }

  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function imageSourceToGeminiPart(imageSource: string) {
  if (imageSource.startsWith("data:")) {
    const parsed = parseDataUrl(imageSource);

    if (!parsed) {
      throw new Error("Unsupported inline image payload.");
    }

    return {
      inlineData: {
        data: parsed.buffer.toString("base64"),
        mimeType: parsed.mimeType,
      },
    };
  }

  const response = await fetch(imageSource);

  if (!response.ok) {
    throw new Error(`Unable to fetch image input: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: response.headers.get("content-type") ?? "image/jpeg",
    },
  };
}
