import type { Edge } from "@xyflow/react";

import type { WorkflowEditorNode } from "@/types/node";
import type {
  WorkflowNodeInputMap,
  WorkflowNodeInputValue,
  WorkflowNodeOutputMap,
  WorkflowNodeTaskResult,
} from "@/types/workflow-execution";

type OutputRegistry = Map<string, WorkflowNodeOutputMap>;

function asString(value: WorkflowNodeInputValue) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function toArray(value: WorkflowNodeInputValue) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => Boolean(item));
  }

  return value ? [value] : [];
}

function incomingEdgesForNode(edges: Edge[], nodeId: string) {
  return edges.filter((edge) => edge.target === nodeId);
}

function directDependencies(edges: Edge[], nodeId: string) {
  return incomingEdgesForNode(edges, nodeId).map((edge) => edge.source);
}

function ancestorClosure(nodeIds: string[], edges: Edge[]) {
  const required = new Set(nodeIds);
  const stack = [...nodeIds];

  while (stack.length > 0) {
    const currentNodeId = stack.pop();

    if (!currentNodeId) {
      continue;
    }

    for (const dependencyId of directDependencies(edges, currentNodeId)) {
      if (required.has(dependencyId)) {
        continue;
      }

      required.add(dependencyId);
      stack.push(dependencyId);
    }
  }

  return required;
}

export function resolveExecutionNodeIds(
  nodes: WorkflowEditorNode[],
  edges: Edge[],
  selectedNodeIds: string[],
) {
  if (selectedNodeIds.length === 0) {
    return nodes.map((node) => node.id);
  }

  return Array.from(ancestorClosure(selectedNodeIds, edges));
}

export function buildExecutionBatches(
  nodes: WorkflowEditorNode[],
  edges: Edge[],
  scopeNodeIds: string[],
) {
  const includedIds = new Set(scopeNodeIds);
  const batches: WorkflowEditorNode[][] = [];
  const inDegree = new Map<string, number>();
  const downstream = new Map<string, string[]>();

  for (const node of nodes) {
    if (!includedIds.has(node.id)) {
      continue;
    }

    inDegree.set(node.id, 0);
    downstream.set(node.id, []);
  }

  for (const edge of edges) {
    if (!includedIds.has(edge.source) || !includedIds.has(edge.target)) {
      continue;
    }

    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    downstream.set(edge.source, [...(downstream.get(edge.source) ?? []), edge.target]);
  }

  let queue = nodes.filter((node) => includedIds.has(node.id) && (inDegree.get(node.id) ?? 0) === 0);

  while (queue.length > 0) {
    const batch = queue;
    const nextQueue: WorkflowEditorNode[] = [];

    batches.push(batch);

    for (const node of batch) {
      for (const targetId of downstream.get(node.id) ?? []) {
        const nextInDegree = (inDegree.get(targetId) ?? 0) - 1;
        inDegree.set(targetId, nextInDegree);

        if (nextInDegree === 0) {
          const targetNode = nodes.find((candidate) => candidate.id === targetId);
          if (targetNode) {
            nextQueue.push(targetNode);
          }
        }
      }
    }

    queue = nextQueue;
  }

  return batches;
}

export function buildNodeInputs(
  node: WorkflowEditorNode,
  edges: Edge[],
  outputsByNodeId: OutputRegistry,
): WorkflowNodeInputMap {
  const incomingEdges = incomingEdgesForNode(edges, node.id);
  const connectedInputs = new Map<string, WorkflowNodeInputValue>();

  for (const edge of incomingEdges) {
    if (!edge.targetHandle) {
      continue;
    }

    const sourceOutputs = outputsByNodeId.get(edge.source);
    const outputValue = sourceOutputs?.[edge.sourceHandle ?? "output"] ?? null;

    if (!connectedInputs.has(edge.targetHandle)) {
      connectedInputs.set(edge.targetHandle, outputValue);
      continue;
    }

    const existingValue = connectedInputs.get(edge.targetHandle);
    connectedInputs.set(edge.targetHandle, [
      ...toArray(existingValue ?? null),
      ...toArray(outputValue),
    ]);
  }

  switch (node.data.kind) {
    case "text":
      return {
        output: node.data.text,
      };
    case "upload-image":
      return {
        output: node.data.imageUrl,
      };
    case "upload-video":
      return {
        output: node.data.videoUrl,
      };
    case "run-llm":
      return {
        system_prompt: connectedInputs.get("system_prompt") ?? node.data.systemPrompt,
        user_message: connectedInputs.get("user_message") ?? node.data.userMessage,
        images: connectedInputs.get("images") ?? [],
      };
    case "crop-image":
      return {
        image_url: connectedInputs.get("image_url") ?? null,
        x_percent: connectedInputs.get("x_percent") ?? node.data.xPercent,
        y_percent: connectedInputs.get("y_percent") ?? node.data.yPercent,
        width_percent: connectedInputs.get("width_percent") ?? node.data.widthPercent,
        height_percent: connectedInputs.get("height_percent") ?? node.data.heightPercent,
      };
    case "extract-frame":
      return {
        video_url: connectedInputs.get("video_url") ?? null,
        timestamp: connectedInputs.get("timestamp") ?? node.data.timestamp,
      };
  }
}

export function applyNodeResultToGraph(
  nodes: WorkflowEditorNode[],
  result: WorkflowNodeTaskResult,
) {
  return nodes.map((node) => {
    if (node.id !== result.nodeId) {
      return node;
    }

    return {
      ...node,
      data: {
        ...node.data,
        status: result.status,
        ...result.dataPatch,
      },
    };
  });
}

export function summarizeInputValue(value: WorkflowNodeInputValue) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value ?? "none";
}

export function summarizeNodeInputs(inputs: WorkflowNodeInputMap) {
  return Object.entries(inputs)
    .map(([key, value]) => `${key}: ${summarizeInputValue(value)}`)
    .join(" | ");
}

export function summarizeNodeOutputs(outputs: WorkflowNodeOutputMap) {
  return Object.entries(outputs)
    .map(([key, value]) => `${key}: ${summarizeInputValue(value)}`)
    .join(" | ");
}

export function readTextInput(inputs: WorkflowNodeInputMap, key: string) {
  return asString(inputs[key] ?? null);
}
