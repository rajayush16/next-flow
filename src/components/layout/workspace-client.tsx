"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { runWorkflowAction } from "@/server/actions/workflow-execution";
import {
  getOrCreateSampleWorkflowAction,
  saveWorkflowAction,
  updateWorkflowAction,
} from "@/server/actions/workflow";
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

  return (
    <WorkspaceShell
      isPending={isPending}
      onCreateWorkflow={handleCreateWorkflow}
      onOpenWorkflow={handleOpenWorkflow}
      onResetToSample={handleResetToSample}
      onRunWorkflow={handleRunWorkflow}
      onSaveWorkflow={handleSaveWorkflow}
    />
  );
}
