import type { WorkflowNodeKind, WorkflowRunStatus, WorkflowRunTarget } from "@/types/node";
import type { Workflow } from "@/types/workflow";

export type WorkflowNodeInputValue = string | string[] | null;
export type WorkflowNodeInputMap = Record<string, WorkflowNodeInputValue>;
export type WorkflowNodeOutputMap = Record<string, WorkflowNodeInputValue>;

export type WorkflowNodeTaskResult = {
  nodeId: string;
  nodeKind: WorkflowNodeKind;
  status: Extract<WorkflowRunStatus, "success" | "failed">;
  inputs: WorkflowNodeInputMap;
  outputs: WorkflowNodeOutputMap;
  inputSummary: string;
  outputSummary: string;
  errorMessage: string | null;
  logs: string[];
  dataPatch: Record<string, unknown>;
};

export type WorkflowExecutionPayload = {
  runId: string;
  workflowId: string;
  userId: string;
  target: WorkflowRunTarget;
  selectedNodeIds: string[];
  workflow: Workflow;
};

export type WorkflowExecutionResult = {
  runId: string;
  workflowId: string;
  status: WorkflowRunStatus;
  selectedNodeIds: string[];
  nodeResults: WorkflowNodeTaskResult[];
};
