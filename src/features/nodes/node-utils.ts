import type { Connection, Edge, XYPosition } from "@xyflow/react";
import { getOutgoers } from "@xyflow/react";

import {
  createNodeData,
  workflowNodeTemplates,
} from "@/features/nodes/node-templates";
import type {
  WorkflowEditorNode,
  WorkflowHandleDefinition,
  WorkflowNodeKind,
  WorkflowNodeTemplate,
} from "@/types/node";

export function findNodeTemplate(kind: WorkflowNodeKind) {
  return workflowNodeTemplates.find((template) => template.kind === kind);
}

export function createNodeFromTemplate(
  template: WorkflowNodeTemplate,
  position: XYPosition = template.position,
): WorkflowEditorNode {
  return {
    id: `${template.kind}-${crypto.randomUUID()}`,
    type: "workflowNode",
    position,
    data: createNodeData(template.kind),
  };
}

function getHandleDefinition(
  node: WorkflowEditorNode | undefined,
  handleId: string | null | undefined,
  direction: "source" | "target",
) {
  if (!node || !handleId) {
    return null;
  }

  const handles =
    direction === "source" ? node.data.outputHandles : node.data.inputHandles;

  return handles.find((handle) => handle.id === handleId) ?? null;
}

function areHandleTypesCompatible(
  source: WorkflowHandleDefinition | null,
  target: WorkflowHandleDefinition | null,
) {
  if (!source || !target) {
    return false;
  }

  if (target.type === "images") {
    return source.type === "image";
  }

  return source.type === target.type;
}

export function canConnectNodes(
  nodes: WorkflowEditorNode[],
  connection: Connection,
) {
  if (!connection.source || !connection.target) {
    return false;
  }

  if (connection.source === connection.target) {
    return false;
  }

  const sourceNode = nodes.find((node) => node.id === connection.source);
  const targetNode = nodes.find((node) => node.id === connection.target);

  const sourceHandle = getHandleDefinition(
    sourceNode,
    connection.sourceHandle,
    "source",
  );
  const targetHandle = getHandleDefinition(
    targetNode,
    connection.targetHandle,
    "target",
  );

  return areHandleTypesCompatible(sourceHandle, targetHandle);
}

export function wouldCreateCycle(
  nodes: WorkflowEditorNode[],
  edges: Edge[],
  connection: Connection,
) {
  if (!connection.source || !connection.target) {
    return false;
  }

  const nextEdges = edges.concat({
    id: `${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
  });

  const sourceNode = nodes.find((node) => node.id === connection.source);
  const targetNode = nodes.find((node) => node.id === connection.target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  const stack = [targetNode];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current.id)) {
      continue;
    }

    if (current.id === sourceNode.id) {
      return true;
    }

    visited.add(current.id);
    const next = getOutgoers(current, nodes, nextEdges);
    stack.push(...next);
  }

  return false;
}

export function isInputConnected(
  nodeId: string,
  handleId: string,
  edges: Edge[],
) {
  return edges.some(
    (edge) => edge.target === nodeId && edge.targetHandle === handleId,
  );
}
