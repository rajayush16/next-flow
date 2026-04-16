import type { Edge, Viewport } from "@xyflow/react";

import type {
  WorkflowEditorNode,
  WorkflowNodeKind,
  WorkflowRunStatus,
  WorkflowRunTarget,
} from "@/types/node";

export type Workflow = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  nodes: WorkflowEditorNode[];
  edges: Edge[];
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowSummary = Pick<
  Workflow,
  "id" | "name" | "description" | "createdAt" | "updatedAt"
>;

export type WorkflowBootstrap = {
  activeWorkflow: Workflow;
  workflows: WorkflowSummary[];
  runs: WorkflowRun[];
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  status: WorkflowRunStatus;
  target: WorkflowRunTarget;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  scopeNodeIds: string[];
  nodeRuns: WorkflowNodeRun[];
};

export type WorkflowNodeRun = {
  id: string;
  nodeId: string;
  nodeKind: WorkflowNodeKind;
  status: WorkflowRunStatus;
  durationMs: number | null;
  inputSummary: string;
  outputSummary: string;
  errorMessage: string | null;
  logs: string[];
};
