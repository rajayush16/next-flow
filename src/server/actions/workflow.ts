"use server";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { sampleWorkflow } from "@/features/workflow/sample-workflow";
import { workflowInputSchema } from "@/server/schemas/workflow";
import { getOrCreateAppUser } from "@/server/actions/shared";
import type { Workflow, WorkflowSummary } from "@/types/workflow";

function parseWorkflowGraph(graph: unknown) {
  const parsed = workflowInputSchema.shape.graph.safeParse(graph);

  if (!parsed.success) {
    throw new Error("Invalid workflow graph in persistence layer.");
  }

  return parsed.data;
}

function mapWorkflowSummary(workflow: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WorkflowSummary {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  };
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function mapWorkflowRecord(workflow: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { clerkUserId: string };
  graph: unknown;
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

export async function listWorkflowsAction(): Promise<WorkflowSummary[]> {
  const user = await getOrCreateAppUser();

  const workflows = await db.workflow.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return workflows.map(mapWorkflowSummary);
}

export async function getWorkflowAction(
  workflowId: string,
): Promise<Workflow | null> {
  const user = await getOrCreateAppUser();

  const workflow = await db.workflow.findFirst({
    where: {
      id: workflowId,
      userId: user.id,
    },
    include: {
      user: {
        select: { clerkUserId: true },
      },
    },
  });

  if (!workflow) {
    return null;
  }

  return mapWorkflowRecord(workflow);
}

export async function getOrCreateSampleWorkflowAction(): Promise<Workflow> {
  const user = await getOrCreateAppUser();

  const existingWorkflow = await db.workflow.findFirst({
    where: {
      userId: user.id,
      name: sampleWorkflow.name,
    },
    include: {
      user: {
        select: { clerkUserId: true },
      },
    },
  });

  if (existingWorkflow) {
    return mapWorkflowRecord(existingWorkflow);
  }

  const createdWorkflow = await db.workflow.create({
    data: {
      userId: user.id,
      name: sampleWorkflow.name,
      description: sampleWorkflow.description,
      graph: toInputJsonValue({
        nodes: sampleWorkflow.nodes,
        edges: sampleWorkflow.edges,
        viewport: sampleWorkflow.viewport,
      }),
      viewport: toInputJsonValue(sampleWorkflow.viewport),
    },
    include: {
      user: {
        select: { clerkUserId: true },
      },
    },
  });

  return mapWorkflowRecord(createdWorkflow);
}

export async function saveWorkflowAction(input: unknown): Promise<Workflow> {
  const user = await getOrCreateAppUser();
  const parsedInput = workflowInputSchema.parse(input);

  const createdWorkflow = await db.workflow.create({
    data: {
      userId: user.id,
      name: parsedInput.name,
      description: parsedInput.description,
      graph: toInputJsonValue(parsedInput.graph),
      viewport: toInputJsonValue(parsedInput.graph.viewport),
    },
    include: {
      user: {
        select: { clerkUserId: true },
      },
    },
  });

  return mapWorkflowRecord(createdWorkflow);
}

export async function updateWorkflowAction(
  workflowId: string,
  input: unknown,
): Promise<Workflow> {
  const user = await getOrCreateAppUser();
  const parsedInput = workflowInputSchema.parse(input);

  const existingWorkflow = await db.workflow.findFirst({
    where: {
      id: workflowId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!existingWorkflow) {
    throw new Error("Workflow not found.");
  }

  const updatedWorkflow = await db.workflow.update({
    where: { id: existingWorkflow.id },
    data: {
      name: parsedInput.name,
      description: parsedInput.description,
      graph: toInputJsonValue(parsedInput.graph),
      viewport: toInputJsonValue(parsedInput.graph.viewport),
    },
    include: {
      user: {
        select: { clerkUserId: true },
      },
    },
  });

  return mapWorkflowRecord(updatedWorkflow);
}
