"use server";

import {
  WorkflowNodeKind as PrismaWorkflowNodeKind,
  WorkflowRunStatus as PrismaWorkflowRunStatus,
  WorkflowRunTarget as PrismaWorkflowRunTarget,
} from "@prisma/client";

import { db } from "@/lib/db";
import { workflowRunInputSchema } from "@/server/schemas/workflow-run";
import { getOrCreateAppUser } from "@/server/actions/shared";
import type {
  WorkflowNodeRun,
  WorkflowRun,
} from "@/types/workflow";
import type {
  WorkflowNodeKind,
  WorkflowRunStatus,
  WorkflowRunTarget,
} from "@/types/node";

function mapRunStatus(status: PrismaWorkflowRunStatus): WorkflowRunStatus {
  return status.toLowerCase() as WorkflowRunStatus;
}

function mapRunTarget(target: PrismaWorkflowRunTarget): WorkflowRunTarget {
  return target.toLowerCase() as WorkflowRunTarget;
}

function mapNodeKind(kind: PrismaWorkflowNodeKind): WorkflowNodeKind {
  return kind.toLowerCase().replaceAll("_", "-") as WorkflowNodeKind;
}

function mapNodeRun(nodeRun: {
  id: string;
  nodeId: string;
  nodeKind: PrismaWorkflowNodeKind;
  status: PrismaWorkflowRunStatus;
  durationMs: number | null;
  inputs: unknown;
  outputs: unknown;
  errorMessage: string | null;
}): WorkflowNodeRun {
  return {
    id: nodeRun.id,
    nodeId: nodeRun.nodeId,
    nodeKind: mapNodeKind(nodeRun.nodeKind),
    status: mapRunStatus(nodeRun.status),
    durationMs: nodeRun.durationMs,
    inputSummary:
      typeof nodeRun.inputs === "string"
        ? nodeRun.inputs
        : JSON.stringify(nodeRun.inputs),
    outputSummary:
      typeof nodeRun.outputs === "string"
        ? nodeRun.outputs
        : JSON.stringify(nodeRun.outputs),
    errorMessage: nodeRun.errorMessage,
  };
}

function mapWorkflowRun(run: {
  id: string;
  workflowId: string;
  status: PrismaWorkflowRunStatus;
  target: PrismaWorkflowRunTarget;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  scopeNodeIds: unknown;
  nodeRuns: Array<{
    id: string;
    nodeId: string;
    nodeKind: PrismaWorkflowNodeKind;
    status: PrismaWorkflowRunStatus;
    durationMs: number | null;
    inputs: unknown;
    outputs: unknown;
    errorMessage: string | null;
  }>;
}): WorkflowRun {
  return {
    id: run.id,
    workflowId: run.workflowId,
    status: mapRunStatus(run.status),
    target: mapRunTarget(run.target),
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    durationMs: run.durationMs,
    scopeNodeIds: Array.isArray(run.scopeNodeIds)
      ? run.scopeNodeIds.filter((value): value is string => typeof value === "string")
      : [],
    nodeRuns: run.nodeRuns.map(mapNodeRun),
  };
}

export async function listWorkflowRunsAction(
  workflowId: string,
): Promise<WorkflowRun[]> {
  const user = await getOrCreateAppUser();

  const runs = await db.workflowRun.findMany({
    where: {
      workflowId,
      userId: user.id,
    },
    orderBy: { startedAt: "desc" },
    include: {
      nodeRuns: {
        orderBy: { startedAt: "asc" },
      },
    },
  });

  return runs.map(mapWorkflowRun);
}

export async function createWorkflowRunAction(input: unknown): Promise<WorkflowRun> {
  const user = await getOrCreateAppUser();
  const parsedInput = workflowRunInputSchema.parse(input);

  const run = await db.workflowRun.create({
    data: {
      workflowId: parsedInput.workflowId,
      userId: user.id,
      status: PrismaWorkflowRunStatus.QUEUED,
      target: parsedInput.target.toUpperCase() as PrismaWorkflowRunTarget,
      scopeNodeIds: parsedInput.nodeIds,
    },
    include: {
      nodeRuns: true,
    },
  });

  return mapWorkflowRun(run);
}
