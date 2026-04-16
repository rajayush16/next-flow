import type { Node } from "@xyflow/react";

export type WorkflowNodeKind =
  | "text"
  | "upload-image"
  | "upload-video"
  | "run-llm"
  | "crop-image"
  | "extract-frame";

export type WorkflowValueType =
  | "text"
  | "number"
  | "image"
  | "video"
  | "images";

export type WorkflowRunStatus =
  | "idle"
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "partial";

export type WorkflowRunTarget = "single" | "selected" | "full";
export type WorkflowNodeIcon =
  | "align-left"
  | "image"
  | "film"
  | "sparkles"
  | "crop"
  | "clapperboard";

export type WorkflowHandleDefinition = {
  id: string;
  label: string;
  type: WorkflowValueType;
  required?: boolean;
  multiple?: boolean;
};

export type BaseWorkflowNodeData = {
  kind: WorkflowNodeKind;
  title: string;
  subtitle: string;
  accent: string;
  icon: WorkflowNodeIcon;
  status: WorkflowRunStatus;
  inputHandles: WorkflowHandleDefinition[];
  outputHandles: WorkflowHandleDefinition[];
};

export type TextNodeData = BaseWorkflowNodeData & {
  kind: "text";
  text: string;
  placeholder: string;
};

export type UploadImageNodeData = BaseWorkflowNodeData & {
  kind: "upload-image";
  fileName: string | null;
  imageUrl: string | null;
};

export type UploadVideoNodeData = BaseWorkflowNodeData & {
  kind: "upload-video";
  fileName: string | null;
  videoUrl: string | null;
};

export type RunLlmNodeData = BaseWorkflowNodeData & {
  kind: "run-llm";
  model: string;
  systemPrompt: string;
  userMessage: string;
  result: string;
};

export type CropImageNodeData = BaseWorkflowNodeData & {
  kind: "crop-image";
  xPercent: string;
  yPercent: string;
  widthPercent: string;
  heightPercent: string;
};

export type ExtractFrameNodeData = BaseWorkflowNodeData & {
  kind: "extract-frame";
  timestamp: string;
};

export type WorkflowNodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | RunLlmNodeData
  | CropImageNodeData
  | ExtractFrameNodeData;

export type WorkflowEditorNode = Node<WorkflowNodeData, "workflowNode">;

export type WorkflowNodeTemplate = {
  kind: WorkflowNodeKind;
  title: string;
  subtitle: string;
  accent: string;
  icon: WorkflowNodeIcon;
  defaultPosition?: {
    x: number;
    y: number;
  };
  position: {
    x: number;
    y: number;
  };
};
