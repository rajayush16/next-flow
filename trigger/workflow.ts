import { tasks, task } from "@trigger.dev/sdk/v3";

import {
  applyNodeResultToGraph,
  buildExecutionBatches,
  buildNodeInputs,
  readTextInput,
  resolveExecutionNodeIds,
  summarizeNodeInputs,
  summarizeNodeOutputs,
} from "@/features/workflow/execution-plan";
import { getGeminiClient } from "@/lib/gemini";
import {
  cleanupTempDir,
  getVideoDurationInSeconds,
  imageSourceToGeminiPart,
  materializeAssetInput,
  runFfmpeg,
  storeProcessedAsset,
} from "@/lib/media";
import {
  completeNodeRunRecord,
  completeWorkflowRunRecord,
  createNodeRunRecord,
  markWorkflowRunRunning,
  updateWorkflowGraphRecord,
} from "@/server/workflow-run-service";
import type { WorkflowEditorNode, WorkflowNodeKind } from "@/types/node";
import type {
  WorkflowExecutionPayload,
  WorkflowExecutionResult,
  WorkflowNodeTaskResult,
} from "@/types/workflow-execution";

type NodeTaskPayload = {
  node: WorkflowEditorNode;
  inputs: Record<string, string | string[] | null>;
};

export const executeTextNodeTask = task({
  id: "execute-text-node",
  run: async ({ node }: NodeTaskPayload): Promise<WorkflowNodeTaskResult> => {
    return {
      nodeId: node.id,
      nodeKind: node.data.kind,
      status: "success",
      inputs: { output: node.data.kind === "text" ? node.data.text : "" },
      outputs: { output: node.data.kind === "text" ? node.data.text : "" },
      inputSummary: node.data.kind === "text" ? node.data.text : "",
      outputSummary: node.data.kind === "text" ? node.data.text : "",
      errorMessage: null,
      logs: ["Text node resolved from editor state."],
      dataPatch: {},
    };
  },
});

export const executeUploadImageNodeTask = task({
  id: "execute-upload-image-node",
  run: async ({ node }: NodeTaskPayload): Promise<WorkflowNodeTaskResult> => {
    if (node.data.kind !== "upload-image" || !node.data.imageUrl) {
      throw new Error("Upload image nodes require an uploaded image.");
    }

    return {
      nodeId: node.id,
      nodeKind: node.data.kind,
      status: "success",
      inputs: { output: node.data.imageUrl },
      outputs: { output: node.data.imageUrl },
      inputSummary: node.data.fileName ?? "Uploaded image",
      outputSummary: node.data.imageUrl,
      errorMessage: null,
      logs: ["Upload image node passed through the uploaded asset."],
      dataPatch: {},
    };
  },
});

export const executeUploadVideoNodeTask = task({
  id: "execute-upload-video-node",
  run: async ({ node }: NodeTaskPayload): Promise<WorkflowNodeTaskResult> => {
    if (node.data.kind !== "upload-video" || !node.data.videoUrl) {
      throw new Error("Upload video nodes require an uploaded video.");
    }

    return {
      nodeId: node.id,
      nodeKind: node.data.kind,
      status: "success",
      inputs: { output: node.data.videoUrl },
      outputs: { output: node.data.videoUrl },
      inputSummary: node.data.fileName ?? "Uploaded video",
      outputSummary: node.data.videoUrl,
      errorMessage: null,
      logs: ["Upload video node passed through the uploaded asset."],
      dataPatch: {},
    };
  },
});

export const executeCropImageNodeTask = task({
  id: "execute-crop-image-node",
  run: async ({ node, inputs }: NodeTaskPayload): Promise<WorkflowNodeTaskResult> => {
    if (node.data.kind !== "crop-image") {
      throw new Error("Invalid crop image node payload.");
    }

    const imageUrl = readTextInput(inputs, "image_url");

    if (!imageUrl) {
      throw new Error("Crop image nodes require an input image.");
    }

    const xPercent = Number.parseFloat(readTextInput(inputs, "x_percent") || "0");
    const yPercent = Number.parseFloat(readTextInput(inputs, "y_percent") || "0");
    const widthPercent = Number.parseFloat(readTextInput(inputs, "width_percent") || "100");
    const heightPercent = Number.parseFloat(readTextInput(inputs, "height_percent") || "100");
    const asset = await materializeAssetInput(imageUrl, `${node.id}-source`);
    const outputPath = `${asset.tempDir}\\${node.id}-cropped.png`;

    try {
      await runFfmpeg([
        "-y",
        "-i",
        asset.inputPath,
        "-vf",
        `crop=iw*${widthPercent / 100}:ih*${heightPercent / 100}:iw*${xPercent / 100}:ih*${yPercent / 100}`,
        outputPath,
      ]);

      const croppedUrl = await storeProcessedAsset({
        outputPath,
        fileName: `${node.id}-cropped.png`,
        mimeType: "image/png",
      });
      const outputs = { output: croppedUrl };

      return {
        nodeId: node.id,
        nodeKind: node.data.kind,
        status: "success",
        inputs,
        outputs,
        inputSummary: summarizeNodeInputs(inputs),
        outputSummary: summarizeNodeOutputs(outputs),
        errorMessage: null,
        logs: ["Image cropped with FFmpeg inside Trigger.dev."],
        dataPatch: {
          imageUrl: croppedUrl,
        },
      };
    } finally {
      await cleanupTempDir(asset.tempDir);
    }
  },
});

export const executeExtractFrameNodeTask = task({
  id: "execute-extract-frame-node",
  run: async ({ node, inputs }: NodeTaskPayload): Promise<WorkflowNodeTaskResult> => {
    if (node.data.kind !== "extract-frame") {
      throw new Error("Invalid extract frame node payload.");
    }

    const videoUrl = readTextInput(inputs, "video_url");

    if (!videoUrl) {
      throw new Error("Extract frame nodes require an input video.");
    }

    const timestampInput = readTextInput(inputs, "timestamp") || "00:00:01";
    const asset = await materializeAssetInput(videoUrl, `${node.id}-source`);
    const outputPath = `${asset.tempDir}\\${node.id}-frame.jpg`;

    try {
      let seekTime = timestampInput;

      if (timestampInput.endsWith("%")) {
        const percentage = Number.parseFloat(timestampInput.slice(0, -1));
        const duration = await getVideoDurationInSeconds(asset.inputPath);

        if (duration && Number.isFinite(percentage)) {
          seekTime = `${Math.max((duration * percentage) / 100, 0.1)}`;
        } else {
          seekTime = "1";
        }
      }

      await runFfmpeg([
        "-y",
        "-ss",
        seekTime,
        "-i",
        asset.inputPath,
        "-frames:v",
        "1",
        outputPath,
      ]);

      const frameUrl = await storeProcessedAsset({
        outputPath,
        fileName: `${node.id}-frame.jpg`,
        mimeType: "image/jpeg",
      });
      const outputs = { output: frameUrl };

      return {
        nodeId: node.id,
        nodeKind: node.data.kind,
        status: "success",
        inputs,
        outputs,
        inputSummary: summarizeNodeInputs(inputs),
        outputSummary: summarizeNodeOutputs(outputs),
        errorMessage: null,
        logs: ["Video frame extracted with FFmpeg inside Trigger.dev."],
        dataPatch: {
          imageUrl: frameUrl,
        },
      };
    } finally {
      await cleanupTempDir(asset.tempDir);
    }
  },
});

export const executeRunLlmNodeTask = task({
  id: "execute-run-llm-node",
  run: async ({ node, inputs }: NodeTaskPayload): Promise<WorkflowNodeTaskResult> => {
    if (node.data.kind !== "run-llm") {
      throw new Error("Invalid LLM node payload.");
    }

    const userMessage = readTextInput(inputs, "user_message");

    if (!userMessage) {
      throw new Error("LLM nodes require a user message.");
    }

    const client = getGeminiClient();

    if (!client) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is required to run LLM nodes.");
    }

    const systemPrompt = readTextInput(inputs, "system_prompt");
    const model = client.getGenerativeModel({
      model: node.data.model || "gemini-2.5-flash",
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
    });
    const imageSources = Array.isArray(inputs.images)
      ? inputs.images.filter((value): value is string => Boolean(value))
      : inputs.images
        ? [inputs.images]
        : [];
    const imageParts = await Promise.all(
      imageSources.map((imageSource) => imageSourceToGeminiPart(imageSource)),
    );
    const response = await model.generateContent([userMessage, ...imageParts]);
    const text = response.response.text().trim();
    const outputs = { output: text };

    return {
      nodeId: node.id,
      nodeKind: node.data.kind,
      status: "success",
      inputs,
      outputs,
      inputSummary: summarizeNodeInputs(inputs),
      outputSummary: summarizeNodeOutputs(outputs),
      errorMessage: null,
      logs: ["Gemini response generated via Trigger.dev."],
      dataPatch: {
        result: text,
      },
    };
  },
});

const taskIdsByKind: Record<WorkflowNodeKind, string> = {
  text: "execute-text-node",
  "upload-image": "execute-upload-image-node",
  "upload-video": "execute-upload-video-node",
  "run-llm": "execute-run-llm-node",
  "crop-image": "execute-crop-image-node",
  "extract-frame": "execute-extract-frame-node",
};

export const executeWorkflowTask = task({
  id: "execute-workflow",
  run: async (payload: WorkflowExecutionPayload): Promise<WorkflowExecutionResult> => {
    const workflowStartedAt = Date.now();
    const scopeNodeIds = resolveExecutionNodeIds(
      payload.workflow.nodes,
      payload.workflow.edges,
      payload.target === "full" ? [] : payload.selectedNodeIds,
    );
    const batches = buildExecutionBatches(payload.workflow.nodes, payload.workflow.edges, scopeNodeIds);
    const outputsByNodeId = new Map<string, Record<string, string | string[] | null>>();
    const nodeResults: WorkflowNodeTaskResult[] = [];
    let workingNodes = payload.workflow.nodes;

    await markWorkflowRunRunning(payload.runId, null);

    try {
      for (const batch of batches) {
        workingNodes = workingNodes.map((node) =>
          batch.some((candidate) => candidate.id === node.id)
            ? {
                ...node,
                data: {
                  ...node.data,
                  status: "running",
                },
              }
            : node,
        );

        await updateWorkflowGraphRecord({
          workflowId: payload.workflowId,
          userId: payload.userId,
          name: payload.workflow.name,
          description: payload.workflow.description,
          graph: {
            nodes: workingNodes,
            edges: payload.workflow.edges,
            viewport: payload.workflow.viewport,
          },
        });

        const batchResults = await Promise.all(
          batch.map(async (node) => {
            const inputs = buildNodeInputs(node, payload.workflow.edges, outputsByNodeId);
            const startedAt = Date.now();
            const nodeRun = await createNodeRunRecord({
              workflowRunId: payload.runId,
              nodeId: node.id,
              nodeKind: node.data.kind,
              inputs,
            });

            try {
              const result = await tasks.triggerAndWait(taskIdsByKind[node.data.kind], {
                node,
                inputs,
              });

              if (!result.ok) {
                throw result.error;
              }

              await completeNodeRunRecord({
                nodeRunId: nodeRun.id,
                status: result.output.status,
                outputs: result.output.outputs,
                errorMessage: result.output.errorMessage,
                logs: result.output.logs,
                durationMs: Date.now() - startedAt,
              });

              return result.output;
            } catch (error) {
              const failedResult: WorkflowNodeTaskResult = {
                nodeId: node.id,
                nodeKind: node.data.kind,
                status: "failed",
                inputs,
                outputs: {},
                inputSummary: summarizeNodeInputs(inputs),
                outputSummary: "No output",
                errorMessage: error instanceof Error ? error.message : "Unknown task failure.",
                logs: ["Node task failed before producing a valid result."],
                dataPatch: {},
              };

              await completeNodeRunRecord({
                nodeRunId: nodeRun.id,
                status: "failed",
                outputs: {},
                errorMessage: failedResult.errorMessage,
                logs: failedResult.logs,
                durationMs: Date.now() - startedAt,
              });

              return failedResult;
            }
          }),
        );

        for (const result of batchResults) {
          nodeResults.push(result);
          outputsByNodeId.set(result.nodeId, result.outputs);
          workingNodes = applyNodeResultToGraph(workingNodes, result);
        }

        await updateWorkflowGraphRecord({
          workflowId: payload.workflowId,
          userId: payload.userId,
          name: payload.workflow.name,
          description: payload.workflow.description,
          graph: {
            nodes: workingNodes,
            edges: payload.workflow.edges,
            viewport: payload.workflow.viewport,
          },
        });
      }

      const failedCount = nodeResults.filter((result) => result.status === "failed").length;
      const status =
        failedCount === 0 ? "success" : failedCount === nodeResults.length ? "failed" : "partial";

      await completeWorkflowRunRecord({
        runId: payload.runId,
        status,
        durationMs: Date.now() - workflowStartedAt,
      });

      return {
        runId: payload.runId,
        workflowId: payload.workflowId,
        status,
        selectedNodeIds: scopeNodeIds,
        nodeResults,
      };
    } catch (error) {
      await completeWorkflowRunRecord({
        runId: payload.runId,
        status: "failed",
        durationMs: Date.now() - workflowStartedAt,
      });

      throw error;
    }
  },
});
