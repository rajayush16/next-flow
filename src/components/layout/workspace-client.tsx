"use client";

import { useEffect, useTransition } from "react";

import { runWorkflowAction } from "@/server/actions/workflow-execution";
import {
  deleteWorkflowAction,
  getWorkflowAction,
  getOrCreateSampleWorkflowAction,
  saveWorkflowAction,
  updateWorkflowAction,
} from "@/server/actions/workflow";
import { listWorkflowRunsAction } from "@/server/actions/workflow-run";
import type { Workflow } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import type { WorkflowBootstrap, WorkflowSummary } from "@/types/workflow";

import { WorkspaceShell } from "./workspace-shell";

export function WorkspaceClient({ bootstrap }: { bootstrap: WorkflowBootstrap }) {
  const [isPending, startTransition] = useTransition();

  const hydrateWorkflow = useWorkflowStore((state) => state.hydrateWorkflow);
  const setRuns = useWorkflowStore((state) => state.setRuns);
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const workflowName = useWorkflowStore((state) => state.workflowName);
  const workflowDescription = useWorkflowStore(
    (state) => state.workflowDescription,
  );
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const viewport = useWorkflowStore((state) => state.viewport);
  const runs = useWorkflowStore((state) => state.runs);
  const selectedNodeIds = useWorkflowStore((state) => state.selectedNodeIds);
  const workflows = useWorkflowStore((state) => state.workflows);

  const toWorkflowSummary = (workflow: Workflow): WorkflowSummary => ({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  });

  const upsertWorkflowSummary = (
    nextWorkflow: Workflow,
    currentWorkflows: WorkflowSummary[],
  ) => [toWorkflowSummary(nextWorkflow), ...currentWorkflows.filter((workflow) => workflow.id !== nextWorkflow.id)];

  const replaceWorkflowUrl = (nextWorkflowId: string) => {
    window.history.replaceState({}, "", `/workflow?workflowId=${encodeURIComponent(nextWorkflowId)}`);
  };

  const loadWorkflowState = async (nextWorkflowId: string) => {
    const [workflow, nextRuns] = await Promise.all([
      getWorkflowAction(nextWorkflowId),
      listWorkflowRunsAction(nextWorkflowId),
    ]);

    if (!workflow) {
      throw new Error("Workflow not found.");
    }

    return {
      workflow,
      runs: nextRuns,
    };
  };

  useEffect(() => {
    hydrateWorkflow(
      bootstrap.activeWorkflow,
      bootstrap.workflows,
      bootstrap.runs,
    );
  }, [bootstrap.activeWorkflow, bootstrap.runs, bootstrap.workflows, hydrateWorkflow]);

  useEffect(() => {
    const hasLiveRun = runs.some(
      (run) => run.status === "queued" || run.status === "running",
    );

    if (!hasLiveRun) {
      return;
    }

    const interval = window.setInterval(() => {
      void listWorkflowRunsAction(workflowId).then((nextRuns) => {
        setRuns(nextRuns);
      });
    }, 2500);

    return () => window.clearInterval(interval);
  }, [runs, setRuns, workflowId]);

  async function handleCreateWorkflow(input: {
    name: string;
    description: string | null;
  }) {
    startTransition(async () => {
      const workflow = await saveWorkflowAction({
        name: input.name,
        description: input.description,
        graph: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      });
      hydrateWorkflow(workflow, upsertWorkflowSummary(workflow, workflows), []);
      replaceWorkflowUrl(workflow.id);
    });
  }

  async function handleOpenWorkflow(nextWorkflowId: string) {
    startTransition(async () => {
      const nextState = await loadWorkflowState(nextWorkflowId);
      hydrateWorkflow(nextState.workflow, workflows, nextState.runs);
      replaceWorkflowUrl(nextWorkflowId);
    });
  }

  async function handleSaveWorkflow() {
    startTransition(async () => {
      const workflow = await updateWorkflowAction(workflowId, {
        name: workflowName,
        description: workflowDescription,
        graph: {
          nodes,
          edges,
          viewport,
        },
      });
      hydrateWorkflow(workflow, upsertWorkflowSummary(workflow, workflows), runs);
    });
  }

  async function handleResetToSample() {
    startTransition(async () => {
      const workflow = await getOrCreateSampleWorkflowAction();
      const nextRuns = await listWorkflowRunsAction(workflow.id);
      hydrateWorkflow(workflow, upsertWorkflowSummary(workflow, workflows), nextRuns);
      replaceWorkflowUrl(workflow.id);
    });
  }

  async function handleRunWorkflow(target: "single" | "selected" | "full") {
    startTransition(async () => {
      const nodeIds =
        target === "full"
          ? []
          : target === "single"
            ? selectedNodeIds.slice(0, 1)
            : selectedNodeIds;

      const run = await runWorkflowAction({
        workflowId,
        name: workflowName,
        description: workflowDescription,
        target,
        nodeIds,
        graph: {
          nodes,
          edges,
          viewport,
        },
      });
      setRuns([run, ...runs]);
    });
  }

  async function handleDeleteWorkflow() {
    startTransition(async () => {
      await deleteWorkflowAction(workflowId);
      const remainingWorkflows = workflows.filter((workflow) => workflow.id !== workflowId);
      const fallbackWorkflow = remainingWorkflows[0] ?? null;

      if (fallbackWorkflow) {
        const nextState = await loadWorkflowState(fallbackWorkflow.id);
        hydrateWorkflow(nextState.workflow, remainingWorkflows, nextState.runs);
        replaceWorkflowUrl(fallbackWorkflow.id);
        return;
      }

      const sampleWorkflow = await getOrCreateSampleWorkflowAction();
      const sampleRuns = await listWorkflowRunsAction(sampleWorkflow.id);
      hydrateWorkflow(sampleWorkflow, [toWorkflowSummary(sampleWorkflow)], sampleRuns);
      replaceWorkflowUrl(sampleWorkflow.id);
    });
  }

  async function handleImportWorkflow(file: File) {
    const rawText = await file.text();
    const parsed = JSON.parse(rawText) as
      | Workflow
      | {
          name?: string;
          description?: string | null;
          graph?: {
            nodes?: Workflow["nodes"];
            edges?: Workflow["edges"];
            viewport?: Workflow["viewport"];
          };
          };

    const isWorkflowExport = (value: Workflow | {
      name?: string;
      description?: string | null;
      graph?: {
        nodes?: Workflow["nodes"];
        edges?: Workflow["edges"];
        viewport?: Workflow["viewport"];
      };
    }): value is Workflow => {
      return "nodes" in value && "edges" in value && "viewport" in value;
    };

    const importedWorkflow =
      "graph" in parsed && parsed.graph
        ? {
            name: parsed.name ?? file.name.replace(/\.json$/i, ""),
            description: parsed.description ?? "Imported workflow",
            graph: {
              nodes: parsed.graph.nodes ?? [],
              edges: parsed.graph.edges ?? [],
              viewport: parsed.graph.viewport ?? { x: 0, y: 0, zoom: 1 },
            },
          }
        : {
            name: parsed.name ?? file.name.replace(/\.json$/i, ""),
            description: parsed.description ?? "Imported workflow",
            graph: {
              nodes: isWorkflowExport(parsed) ? parsed.nodes : [],
              edges: isWorkflowExport(parsed) ? parsed.edges : [],
              viewport: isWorkflowExport(parsed)
                ? parsed.viewport
                : { x: 0, y: 0, zoom: 1 },
            },
          };

    startTransition(async () => {
      const workflow = await saveWorkflowAction(importedWorkflow);
      hydrateWorkflow(workflow, upsertWorkflowSummary(workflow, workflows), []);
      replaceWorkflowUrl(workflow.id);
    });
  }

  function handleExportWorkflow() {
    const payload = {
      name: workflowName,
      description: workflowDescription,
      graph: {
        nodes,
        edges,
        viewport,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${workflowName.toLowerCase().replaceAll(/\s+/g, "-") || "workflow"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <WorkspaceShell
      onDeleteWorkflow={handleDeleteWorkflow}
      isPending={isPending}
      onCreateWorkflow={handleCreateWorkflow}
      onExportWorkflow={handleExportWorkflow}
      onImportWorkflow={handleImportWorkflow}
      onOpenWorkflow={handleOpenWorkflow}
      onResetToSample={handleResetToSample}
      onRunWorkflow={handleRunWorkflow}
      onSaveWorkflow={handleSaveWorkflow}
    />
  );
}
