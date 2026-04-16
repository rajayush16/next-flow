import type {
  CropImageNodeData,
  ExtractFrameNodeData,
  RunLlmNodeData,
  TextNodeData,
  UploadImageNodeData,
  UploadVideoNodeData,
  WorkflowNodeKind,
  WorkflowNodeTemplate,
} from "@/types/node";

export const workflowNodeTemplates: WorkflowNodeTemplate[] = [
  {
    kind: "text",
    title: "Text Node",
    subtitle: "Plain text input",
    accent: "#f5f5f5",
    icon: "align-left",
    position: { x: 120, y: 96 },
  },
  {
    kind: "upload-image",
    title: "Upload Image",
    subtitle: "Transloadit image input",
    accent: "#f97316",
    icon: "image",
    position: { x: 120, y: 360 },
  },
  {
    kind: "upload-video",
    title: "Upload Video",
    subtitle: "Transloadit video input",
    accent: "#38bdf8",
    icon: "film",
    position: { x: 120, y: 624 },
  },
  {
    kind: "run-llm",
    title: "Run Any LLM",
    subtitle: "Gemini via Trigger.dev",
    accent: "#8b5cf6",
    icon: "sparkles",
    position: { x: 700, y: 210 },
  },
  {
    kind: "crop-image",
    title: "Crop Image",
    subtitle: "FFmpeg crop step",
    accent: "#ec4899",
    icon: "crop",
    position: { x: 420, y: 340 },
  },
  {
    kind: "extract-frame",
    title: "Extract Frame",
    subtitle: "FFmpeg frame capture",
    accent: "#14b8a6",
    icon: "clapperboard",
    position: { x: 430, y: 640 },
  },
];

export function createNodeData(kind: WorkflowNodeKind) {
  switch (kind) {
    case "text":
      return {
        kind,
        title: "Text Node",
        subtitle: "Plain text input",
        accent: "#f5f5f5",
        icon: "align-left",
        status: "idle",
        inputHandles: [],
        outputHandles: [{ id: "output", label: "Output", type: "text" }],
        text: "",
        placeholder: "Enter text",
      } satisfies TextNodeData;
    case "upload-image":
      return {
        kind,
        title: "Upload Image",
        subtitle: "Transloadit image input",
        accent: "#f97316",
        icon: "image",
        status: "idle",
        inputHandles: [],
        outputHandles: [{ id: "output", label: "Image", type: "image" }],
        fileName: null,
        imageUrl: null,
      } satisfies UploadImageNodeData;
    case "upload-video":
      return {
        kind,
        title: "Upload Video",
        subtitle: "Transloadit video input",
        accent: "#38bdf8",
        icon: "film",
        status: "idle",
        inputHandles: [],
        outputHandles: [{ id: "output", label: "Video", type: "video" }],
        fileName: null,
        videoUrl: null,
      } satisfies UploadVideoNodeData;
    case "run-llm":
      return {
        kind,
        title: "Run Any LLM",
        subtitle: "Gemini via Trigger.dev",
        accent: "#8b5cf6",
        icon: "sparkles",
        status: "running",
        inputHandles: [
          { id: "system_prompt", label: "System", type: "text" },
          { id: "user_message", label: "User", type: "text", required: true },
          { id: "images", label: "Images", type: "image", multiple: true },
        ],
        outputHandles: [{ id: "output", label: "Output", type: "text" }],
        model: "gemini-2.5-flash",
        systemPrompt: "",
        userMessage: "",
        result: "",
      } satisfies RunLlmNodeData;
    case "crop-image":
      return {
        kind,
        title: "Crop Image",
        subtitle: "FFmpeg crop step",
        accent: "#ec4899",
        icon: "crop",
        status: "idle",
        inputHandles: [
          { id: "image_url", label: "Image", type: "image", required: true },
          { id: "x_percent", label: "X", type: "number" },
          { id: "y_percent", label: "Y", type: "number" },
          { id: "width_percent", label: "Width", type: "number" },
          { id: "height_percent", label: "Height", type: "number" },
        ],
        outputHandles: [{ id: "output", label: "Output", type: "image" }],
        xPercent: "0",
        yPercent: "0",
        widthPercent: "80",
        heightPercent: "80",
        previewUrl: null,
      } satisfies CropImageNodeData;
    case "extract-frame":
      return {
        kind,
        title: "Extract Frame",
        subtitle: "FFmpeg frame capture",
        accent: "#14b8a6",
        icon: "clapperboard",
        status: "idle",
        inputHandles: [
          { id: "video_url", label: "Video", type: "video", required: true },
          { id: "timestamp", label: "Time", type: "text" },
        ],
        outputHandles: [{ id: "output", label: "Frame", type: "image" }],
        timestamp: "50%",
        previewUrl: null,
      } satisfies ExtractFrameNodeData;
  }
}
