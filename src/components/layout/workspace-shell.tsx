"use client";

import { PanelLeftClose, Play, Share2, Sparkles } from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
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
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const viewport = useWorkflowStore((state) => state.viewport);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowStore((state) => state.onConnect);
  const setViewport = useWorkflowStore((state) => state.setViewport);
  const setSelectedNodeIds = useWorkflowStore((state) => state.setSelectedNodeIds);

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
        setSelectedNodeIds(selectedNodes.map((node) => node.id))
      }
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
                  React Flow canvas, protected routes, and Krea-inspired shell
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
