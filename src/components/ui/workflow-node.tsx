"use client";

import { useRef, useState } from "react";
import {
  AlignLeft,
  Clapperboard,
  Crop,
  Film,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { Handle, Position } from "@xyflow/react";

import { isInputConnected } from "@/features/nodes/node-utils";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";
import type { WorkflowNodeData } from "@/types/node";

const iconMap = {
  "align-left": AlignLeft,
  image: ImageIcon,
  film: Film,
  sparkles: Sparkles,
  crop: Crop,
  clapperboard: Clapperboard,
};

type WorkflowNodeProps = {
  id: string;
  data: WorkflowNodeData;
  selected?: boolean;
};

function InputField({
  label,
  value,
  disabled,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const className =
    "type-input w-full rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-white/88 outline-none transition placeholder:text-white/20 disabled:border-white/[0.03] disabled:bg-white/[0.02] disabled:text-white/28";

  return (
    <label className="flex flex-col gap-1.5">
      <span className="type-eyebrow text-white/32">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={4}
          className={className}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={className}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file preview."));
    };

    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

export function WorkflowNode({ id, data, selected = false }: WorkflowNodeProps) {
  const Icon = iconMap[data.icon];
  const edges = useWorkflowStore((state) => state.edges);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadState, setUploadState] = useState<{
    status: "idle" | "uploading" | "error";
    message: string | null;
  }>({
    status: "idle",
    message: null,
  });

  async function handleUpload(file: File, kind: "upload-image" | "upload-video") {
    setUploadState({
      status: "uploading",
      message: null,
    });

    try {
      const body = new FormData();
      body.set("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body,
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          fileName: string;
          url: string;
        };

        updateNodeData(id, "fileName", payload.fileName);
        updateNodeData(
          id,
          kind === "upload-image" ? "imageUrl" : "videoUrl",
          payload.url,
        );
        setUploadState({ status: "idle", message: "Uploaded via Transloadit." });
        return;
      }

      const localPreview = await fileToDataUrl(file);
      updateNodeData(id, "fileName", file.name);
      updateNodeData(
        id,
        kind === "upload-image" ? "imageUrl" : "videoUrl",
        localPreview,
      );
      setUploadState({
        status: "idle",
        message: "Transloadit unavailable. Using local preview.",
      });
    } catch (error) {
      setUploadState({
        status: "error",
        message: error instanceof Error ? error.message : "Upload failed.",
      });
    }
  }

  return (
    <div
      className={cn(
        "nextflow-node relative w-[320px] rounded-[28px] border border-white/8 bg-[#0f0f12]/98 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.46)] backdrop-blur-xl transition",
        selected && "border-white/18 shadow-[0_28px_80px_rgba(124,58,237,0.28)]",
        data.status === "running" && "nextflow-node-running",
      )}
    >
      <div className="absolute inset-x-5 top-0 h-px bg-white/12" />

      {data.inputHandles.map((handle, index) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-[#120f17] !bg-[#6d28d9]"
          style={{ top: 88 + index * 46 }}
        />
      ))}

      {data.outputHandles.map((handle, index) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-[#120f17] !bg-white"
          style={{ top: 88 + index * 46 }}
        />
      ))}

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${data.accent}26` }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="type-card-title text-white">
              {data.title}
            </p>
            <p className="type-meta mt-0.5 text-white/46">{data.subtitle}</p>
          </div>
        </div>

        <div className="type-badge rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 uppercase text-white/45">
          {data.status}
        </div>
      </div>

      <div className="space-y-3">
        {data.kind === "text" ? (
          <InputField
            label="Text"
            value={data.text}
            disabled={false}
            multiline
            placeholder={data.placeholder}
            onChange={(value) => updateNodeData(id, "text", value)}
          />
        ) : null}

        {data.kind === "upload-image" ? (
          <div className="space-y-3">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                void handleUpload(file, "upload-image");
                event.target.value = "";
              }}
            />
            <div className="rounded-[24px] border border-white/8 bg-[#131317] p-3">
              {data.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.imageUrl}
                  alt={data.fileName ?? "Uploaded preview"}
                  className="h-36 w-full rounded-[18px] object-cover"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="type-body flex h-36 w-full items-center justify-center rounded-[18px] border border-dashed border-white/12 text-white/30 transition hover:border-white/20 hover:text-white/54"
                >
                  {uploadState.status === "uploading" ? "Uploading..." : "Upload image"}
                </button>
              )}
            </div>
            <div className="type-meta flex items-center justify-between gap-3 text-white/38">
              <p>{data.fileName ?? "No file selected"}</p>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="type-eyebrow rounded-full border border-white/10 px-3 py-1.5 text-white/58 transition hover:bg-white/[0.06] hover:text-white"
              >
                Replace
              </button>
            </div>
            {uploadState.message ? (
              <p className="type-meta text-white/46">
                {uploadState.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {data.kind === "upload-video" ? (
          <div className="space-y-3">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                void handleUpload(file, "upload-video");
                event.target.value = "";
              }}
            />
            <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#131317] p-3">
              {data.videoUrl ? (
                <video
                  className="h-36 w-full rounded-[18px] object-cover"
                  src={data.videoUrl}
                  muted
                  playsInline
                  controls
                />
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="type-body flex h-36 w-full items-center justify-center rounded-[18px] border border-dashed border-white/12 text-white/30 transition hover:border-white/20 hover:text-white/54"
                >
                  {uploadState.status === "uploading" ? "Uploading..." : "Upload video"}
                </button>
              )}
            </div>
            <div className="type-meta flex items-center justify-between gap-3 text-white/38">
              <p>{data.fileName ?? "No file selected"}</p>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="type-eyebrow rounded-full border border-white/10 px-3 py-1.5 text-white/58 transition hover:bg-white/[0.06] hover:text-white"
              >
                Replace
              </button>
            </div>
            {uploadState.message ? (
              <p className="type-meta text-white/46">
                {uploadState.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {data.kind === "run-llm" ? (
          <>
            <InputField
              label="Model"
              value={data.model}
              disabled={false}
              onChange={(value) => updateNodeData(id, "model", value)}
            />
            <InputField
              label="System Prompt"
              value={data.systemPrompt}
              disabled={isInputConnected(id, "system_prompt", edges)}
              multiline
              placeholder="Optional system prompt"
              onChange={(value) => updateNodeData(id, "systemPrompt", value)}
            />
            <InputField
              label="User Message"
              value={data.userMessage}
              disabled={isInputConnected(id, "user_message", edges)}
              multiline
              placeholder="Required user message"
              onChange={(value) => updateNodeData(id, "userMessage", value)}
            />
            <div className="type-body rounded-[24px] border border-white/8 bg-white/[0.03] p-3 text-white/72">
              {data.result || "Result renders inline on the node after execution."}
            </div>
          </>
        ) : null}

        {data.kind === "crop-image" ? (
          <div className="space-y-3">
            {data.previewUrl ? (
              <div className="rounded-[24px] border border-white/8 bg-[#131317] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.previewUrl}
                  alt="Cropped preview"
                  className="h-32 w-full rounded-[18px] object-cover"
                />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="X %"
                value={data.xPercent}
                disabled={isInputConnected(id, "x_percent", edges)}
                onChange={(value) => updateNodeData(id, "xPercent", value)}
              />
              <InputField
                label="Y %"
                value={data.yPercent}
                disabled={isInputConnected(id, "y_percent", edges)}
                onChange={(value) => updateNodeData(id, "yPercent", value)}
              />
              <InputField
                label="Width %"
                value={data.widthPercent}
                disabled={isInputConnected(id, "width_percent", edges)}
                onChange={(value) => updateNodeData(id, "widthPercent", value)}
              />
              <InputField
                label="Height %"
                value={data.heightPercent}
                disabled={isInputConnected(id, "height_percent", edges)}
                onChange={(value) => updateNodeData(id, "heightPercent", value)}
              />
            </div>
          </div>
        ) : null}

        {data.kind === "extract-frame" ? (
          <div className="space-y-3">
            {data.previewUrl ? (
              <div className="rounded-[24px] border border-white/8 bg-[#131317] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.previewUrl}
                  alt="Extracted frame preview"
                  className="h-32 w-full rounded-[18px] object-cover"
                />
              </div>
            ) : null}
            <InputField
              label="Timestamp"
              value={data.timestamp}
              disabled={isInputConnected(id, "timestamp", edges)}
              onChange={(value) => updateNodeData(id, "timestamp", value)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
