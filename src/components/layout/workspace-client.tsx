"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { runWorkflowAction } from "@/server/actions/workflow-execution";
import {
  deleteWorkflowAction,
  getOrCreateSampleWorkflowAction,
  saveWorkflowAction,
  updateWorkflowAction,
} from "@/server/actions/workflow";
import type { Workflow } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import type { WorkflowBootstrap } from "@/types/workflow";

import { WorkspaceShell } from "./workspace-shell";

export function WorkspaceClient({ bootstrap }: { bootstrap: WorkflowBootstrap }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const hydrateWorkflow = useWorkflowStore((state) => state.hydrateWorkflow);
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
      router.refresh();
    }, 2500);

    return () => window.clearInterval(interval);
  }, [router, runs]);

  async function handleCreateWorkflow() {
    startTransition(async () => {
      const workflow = await saveWorkflowAction({
        name: "Untitled workflow",
        description: "New LLM workflow",
        graph: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      });

      const params = new URLSearchParams(searchParams.toString());
      params.set("workflowId", workflow.id);
      router.push(`/workflow?${params.toString()}`);
      router.refresh();
    });
  }

  async function handleOpenWorkflow(nextWorkflowId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("workflowId", nextWorkflowId);
    router.push(`/workflow?${params.toString()}`);
    router.refresh();
  }

  async function handleSaveWorkflow() {
    startTransition(async () => {
      await updateWorkflowAction(workflowId, {
        name: workflowName,
        description: workflowDescription,
        graph: {
          nodes,
          edges,
          viewport,
        },
      });
      router.refresh();
    });
  }

  async function handleResetToSample() {
    startTransition(async () => {
      const workflow = await getOrCreateSampleWorkflowAction();
      const params = new URLSearchParams(searchParams.toString());
      params.set("workflowId", workflow.id);
      router.push(`/workflow?${params.toString()}`);
      router.refresh();
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

      await runWorkflowAction({
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
      router.refresh();
    });
  }

  async function handleDeleteWorkflow() {
    startTransition(async () => {
      await deleteWorkflowAction(workflowId);

      const fallbackWorkflow =
        workflows.find((workflow) => workflow.id !== workflowId) ?? null;

      if (fallbackWorkflow) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("workflowId", fallbackWorkflow.id);
        router.push(`/workflow?${params.toString()}`);
      } else {
        router.push("/workflow");
      }

      router.refresh();
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
      const params = new URLSearchParams(searchParams.toString());
      params.set("workflowId", workflow.id);
      router.push(`/workflow?${params.toString()}`);
      router.refresh();
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
