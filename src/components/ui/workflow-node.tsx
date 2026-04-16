"use client";

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
    "w-full rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/88 outline-none transition placeholder:text-white/20 disabled:border-white/[0.03] disabled:bg-white/[0.02] disabled:text-white/28";

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/32">
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

export function WorkflowNode({ id, data, selected = false }: WorkflowNodeProps) {
  const Icon = iconMap[data.icon];
  const edges = useWorkflowStore((state) => state.edges);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

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
            <p className="text-sm font-semibold tracking-tight text-white">
              {data.title}
            </p>
            <p className="text-xs text-white/42">{data.subtitle}</p>
          </div>
        </div>

        <div className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.26em] text-white/45">
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
            <div className="rounded-[24px] border border-white/8 bg-[#131317] p-3">
              {data.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.imageUrl}
                  alt={data.fileName ?? "Uploaded preview"}
                  className="h-36 w-full rounded-[18px] object-cover"
                />
              ) : (
                <div className="flex h-36 items-center justify-center rounded-[18px] border border-dashed border-white/12 text-sm text-white/30">
                  Drop image
                </div>
              )}
            </div>
            <p className="text-xs text-white/35">{data.fileName ?? "No file selected"}</p>
          </div>
        ) : null}

        {data.kind === "upload-video" ? (
          <div className="space-y-3">
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
                <div className="flex h-36 items-center justify-center rounded-[18px] border border-dashed border-white/12 text-sm text-white/30">
                  Drop video
                </div>
              )}
            </div>
            <p className="text-xs text-white/35">{data.fileName ?? "No file selected"}</p>
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
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-3 text-sm leading-6 text-white/72">
              {data.result || "Result renders inline on the node after execution."}
            </div>
          </>
        ) : null}

        {data.kind === "crop-image" ? (
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
        ) : null}

        {data.kind === "extract-frame" ? (
          <InputField
            label="Timestamp"
            value={data.timestamp}
            disabled={isInputConnected(id, "timestamp", edges)}
            onChange={(value) => updateNodeData(id, "timestamp", value)}
          />
        ) : null}
      </div>
    </div>
  );
}
