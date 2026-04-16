"use client";

import { useEffect } from "react";
import {
  PanelLeftClose,
  Play,
  Redo2,
  Share2,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";

import { EditorSidebar } from "@/components/layout/editor-sidebar";
import { HistoryPanel } from "@/components/layout/history-panel";
import { NextFlowLogo } from "@/components/ui/nextflow-logo";
import { WorkflowNode } from "@/components/ui/workflow-node";
import { useWorkflowStore } from "@/store/workflow-store";

const nodeTypes = {
  workflowNode: WorkflowNode,
};

function FlowCanvas() {
  const { fitView } = useReactFlow();
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const viewport = useWorkflowStore((state) => state.viewport);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowStore((state) => state.onConnect);
  const setViewport = useWorkflowStore((state) => state.setViewport);
  const setSelectedNodeIds = useWorkflowStore((state) => state.setSelectedNodeIds);
  const setSelectedNodeId = useWorkflowStore((state) => state.setSelectedNodeId);
  const selectedNodeIds = useWorkflowStore((state) => state.selectedNodeIds);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
      const isRedo =
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "y" ||
          (event.shiftKey && event.key.toLowerCase() === "z"));

      if (isUndo) {
        event.preventDefault();
        undo();
        return;
      }

      if (isRedo) {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
          return;
        }

        selectedNodeIds.forEach((nodeId) => deleteNode(nodeId));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteNode, redo, selectedNodeIds, undo]);

  return (
    <ReactFlow
      fitView
      nodeTypes={nodeTypes}
      nodes={nodes}
      edges={edges}
      defaultViewport={viewport}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onMoveEnd={(_, currentViewport) => setViewport(currentViewport)}
      onSelectionChange={({ nodes: selectedNodes }) =>
        {
          const nextSelectedNodeIds = selectedNodes.map((node) => node.id);
          setSelectedNodeIds(nextSelectedNodeIds);
          setSelectedNodeId(nextSelectedNodeIds[0] ?? null);
        }
      }
      deleteKeyCode={null}
      multiSelectionKeyCode={["Meta", "Control"]}
      onInit={() => {
        void fitView({ duration: 400, padding: 0.14 });
      }}
      minZoom={0.35}
      maxZoom={1.2}
      className="nextflow-react-flow"
      proOptions={{ hideAttribution: true }}
    >
      <Background
        id="dots"
        gap={22}
        size={1}
        variant={BackgroundVariant.Dots}
        color="rgba(255,255,255,0.14)"
      />
      <MiniMap
        pannable
        zoomable
        position="bottom-right"
        maskColor="rgba(5, 5, 8, 0.72)"
        nodeColor="#7c3aed"
        className="!overflow-hidden !rounded-[22px] !border !border-white/8 !bg-[#0d0d10]/90"
      />
      <Controls
        position="bottom-left"
        className="!overflow-hidden !rounded-[18px] !border !border-white/8 !bg-[#0d0d10]/90"
      />
    </ReactFlow>
  );
}

export function WorkspaceShell() {
  const selectedNodeIds = useWorkflowStore((state) => state.selectedNodeIds);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const canUndo = useWorkflowStore((state) => state.canUndo);
  const canRedo = useWorkflowStore((state) => state.canRedo);

  return (
    <div className="flex min-h-screen flex-col bg-[#050507] text-white">
      <header className="flex items-center justify-between border-b border-white/6 px-6 py-4">
        <div className="flex items-center gap-4">
          <NextFlowLogo />
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-white/28">
              NextFlow
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-white">
              Product Marketing Kit Generator
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Redo2 className="h-4 w-4" />
            Redo
          </button>
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white"
          >
            <PanelLeftClose className="h-4 w-4" />
            Layout
          </button>
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Share2 className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => selectedNodeIds.forEach((nodeId) => deleteNode(nodeId))}
            disabled={selectedNodeIds.length === 0}
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90"
          >
            <Play className="h-4 w-4 fill-current" />
            Run workflow
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 gap-4 px-4 py-4">
        <EditorSidebar />

        <section className="relative min-h-[calc(100vh-104px)] min-w-0 flex-1 overflow-hidden rounded-[32px] border border-white/8 bg-[#07070a]">
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/6 bg-black/28 px-5 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                <Sparkles className="h-4 w-4 text-white/68" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/28">
                  Workflow Builder
                </p>
                <p className="text-sm text-white/58">
                  {selectedNodeIds.length > 0
                    ? `${selectedNodeIds.length} node${selectedNodeIds.length === 1 ? "" : "s"} selected`
                    : "React Flow canvas, protected routes, and Krea-inspired shell"}
                </p>
              </div>
            </div>
          </div>

          <div className="h-full pt-[73px]">
            <ReactFlowProvider>
              <FlowCanvas />
            </ReactFlowProvider>
          </div>
        </section>

        <HistoryPanel />
      </main>
    </div>
  );
}
