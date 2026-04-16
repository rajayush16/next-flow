import type { Prisma } from "@prisma/client";
import {
  WorkflowNodeKind as PrismaWorkflowNodeKind,
  WorkflowRunStatus as PrismaWorkflowRunStatus,
  WorkflowRunTarget as PrismaWorkflowRunTarget,
} from "@prisma/client";

import { db } from "@/lib/db";
import { workflowInputSchema } from "@/server/schemas/workflow";
import type { WorkflowEditorNode, WorkflowNodeKind, WorkflowRunStatus, WorkflowRunTarget } from "@/types/node";
import type { WorkflowNodeInputMap, WorkflowNodeOutputMap } from "@/types/workflow-execution";
import type { Workflow } from "@/types/workflow";

function parseWorkflowGraph(graph: unknown) {
  const parsed = workflowInputSchema.shape.graph.safeParse(graph);

  if (!parsed.success) {
    throw new Error("Invalid workflow graph in persistence layer.");
  }

  return parsed.data;
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toPrismaNodeKind(kind: WorkflowNodeKind) {
  return kind.toUpperCase().replaceAll("-", "_") as PrismaWorkflowNodeKind;
}

function toPrismaRunStatus(status: WorkflowRunStatus) {
  return status.toUpperCase() as PrismaWorkflowRunStatus;
}

function toPrismaRunTarget(target: WorkflowRunTarget) {
  return target.toUpperCase() as PrismaWorkflowRunTarget;
}

export function mapWorkflowRecordToApp(workflow: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  graph: unknown;
  user: { clerkUserId: string };
}): Workflow {
  const parsedGraph = parseWorkflowGraph(workflow.graph);

  return {
    id: workflow.id,
    userId: workflow.user.clerkUserId,
    name: workflow.name,
    description: workflow.description,
    nodes: parsedGraph.nodes as Workflow["nodes"],
    edges: parsedGraph.edges as Workflow["edges"],
    viewport: parsedGraph.viewport,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  };
}

export async function updateWorkflowGraphRecord(args: {
  workflowId: string;
  userId: string;
  name: string;
  description: string | null;
  graph: {
    nodes: WorkflowEditorNode[];
    edges: Workflow["edges"];
    viewport: Workflow["viewport"];
  };
}) {
  return db.workflow.updateMany({
    where: {
      id: args.workflowId,
      userId: args.userId,
    },
    data: {
      name: args.name,
      description: args.description,
      graph: toInputJsonValue(args.graph),
      viewport: toInputJsonValue(args.graph.viewport),
    },
  });
}

export async function createWorkflowRunRecord(args: {
  workflowId: string;
  userId: string;
  target: WorkflowRunTarget;
  scopeNodeIds: string[];
}) {
  return db.workflowRun.create({
    data: {
      workflowId: args.workflowId,
      userId: args.userId,
      status: PrismaWorkflowRunStatus.QUEUED,
      target: toPrismaRunTarget(args.target),
      scopeNodeIds: args.scopeNodeIds,
    },
  });
}

export async function markWorkflowRunRunning(runId: string, triggerRunId: string | null) {
  return db.workflowRun.update({
    where: { id: runId },
    data: {
      status: PrismaWorkflowRunStatus.RUNNING,
      triggerRunId,
      startedAt: new Date(),
    },
  });
}

export async function attachTriggerRunId(runId: string, triggerRunId: string) {
  return db.workflowRun.update({
    where: { id: runId },
    data: {
      triggerRunId,
    },
  });
}

export async function createNodeRunRecord(args: {
  workflowRunId: string;
  nodeId: string;
  nodeKind: WorkflowNodeKind;
  inputs: WorkflowNodeInputMap;
}) {
  return db.workflowNodeRun.create({
    data: {
      workflowRunId: args.workflowRunId,
      nodeId: args.nodeId,
      nodeKind: toPrismaNodeKind(args.nodeKind),
      status: PrismaWorkflowRunStatus.RUNNING,
      inputs: toInputJsonValue(args.inputs),
      outputs: toInputJsonValue({}),
      logs: toInputJsonValue([]),
      startedAt: new Date(),
    },
  });
}

export async function completeNodeRunRecord(args: {
  nodeRunId: string;
  status: Extract<WorkflowRunStatus, "success" | "failed">;
  outputs: WorkflowNodeOutputMap;
  errorMessage: string | null;
  logs: string[];
  durationMs: number;
}) {
  return db.workflowNodeRun.update({
    where: { id: args.nodeRunId },
    data: {
      status: toPrismaRunStatus(args.status),
      outputs: toInputJsonValue(args.outputs),
      errorMessage: args.errorMessage,
      logs: toInputJsonValue(args.logs),
      durationMs: args.durationMs,
      finishedAt: new Date(),
    },
  });
}

export async function completeWorkflowRunRecord(args: {
  runId: string;
  status: Exclude<WorkflowRunStatus, "idle" | "queued" | "running">;
  durationMs: number;
}) {
  return db.workflowRun.update({
    where: { id: args.runId },
    data: {
      status: toPrismaRunStatus(args.status),
      durationMs: args.durationMs,
      finishedAt: new Date(),
    },
  });
}
