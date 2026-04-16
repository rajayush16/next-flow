"use server";

import type { Edge } from "@xyflow/react";
import { tasks } from "@trigger.dev/sdk/v3";

import { resolveExecutionNodeIds } from "@/features/workflow/execution-plan";
import { env } from "@/lib/env";
import { getOrCreateAppUser } from "@/server/actions/shared";
import { workflowExecutionInputSchema } from "@/server/schemas/workflow-execution";
import {
  attachTriggerRunId,
  createWorkflowRunRecord,
  updateWorkflowGraphRecord,
} from "@/server/workflow-run-service";
import type { WorkflowEditorNode } from "@/types/node";
import type { WorkflowRun } from "@/types/workflow";

export async function runWorkflowAction(input: unknown): Promise<WorkflowRun> {
  if (!env.TRIGGER_SECRET_KEY) {
    throw new Error("TRIGGER_SECRET_KEY is required to execute workflows.");
  }

  const user = await getOrCreateAppUser();
  const parsedInput = workflowExecutionInputSchema.parse(input);
  const typedNodes = parsedInput.graph.nodes as WorkflowEditorNode[];
  const typedEdges = parsedInput.graph.edges as Edge[];
  const scopeNodeIds = resolveExecutionNodeIds(
    typedNodes,
    typedEdges,
    parsedInput.target === "full" ? [] : parsedInput.nodeIds,
  );

  await updateWorkflowGraphRecord({
    workflowId: parsedInput.workflowId,
    userId: user.id,
    name: parsedInput.name,
    description: parsedInput.description,
    graph: {
      nodes: typedNodes,
      edges: typedEdges,
      viewport: parsedInput.graph.viewport,
    },
  });

  const run = await createWorkflowRunRecord({
    workflowId: parsedInput.workflowId,
    userId: user.id,
    target: parsedInput.target,
    scopeNodeIds,
  });

  const handle = await tasks.trigger("execute-workflow", {
    runId: run.id,
    workflowId: parsedInput.workflowId,
    userId: user.id,
    target: parsedInput.target,
    selectedNodeIds: parsedInput.nodeIds,
    workflow: {
      id: parsedInput.workflowId,
      userId: user.clerkUserId,
      name: parsedInput.name,
      description: parsedInput.description,
      nodes: typedNodes,
      edges: typedEdges,
      viewport: parsedInput.graph.viewport,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  await attachTriggerRunId(run.id, handle.id);

  return {
    id: run.id,
    workflowId: run.workflowId,
    status: "queued",
    target: parsedInput.target,
    startedAt: run.startedAt.toISOString(),
    finishedAt: null,
    durationMs: null,
    scopeNodeIds,
    nodeRuns: [],
  };
}
