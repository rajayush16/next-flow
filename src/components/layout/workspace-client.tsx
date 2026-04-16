"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const hasHydrated = useRef(false);
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

  useEffect(() => {
    if (hasHydrated.current) {
      return;
    }

    hydrateWorkflow(
      bootstrap.activeWorkflow,
      bootstrap.workflows,
      bootstrap.runs,
    );
    hasHydrated.current = true;
  }, [bootstrap.activeWorkflow, bootstrap.runs, bootstrap.workflows, hydrateWorkflow]);

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

  return (
    <WorkspaceShell
      isPending={isPending}
      onCreateWorkflow={handleCreateWorkflow}
      onOpenWorkflow={handleOpenWorkflow}
      onResetToSample={handleResetToSample}
      onSaveWorkflow={handleSaveWorkflow}
    />
  );
}
