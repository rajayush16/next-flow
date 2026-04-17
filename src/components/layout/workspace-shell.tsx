"use client";

import { useEffect, useRef } from "react";
import { SignOutButton } from "@clerk/nextjs";
import {
  ChevronDown,
  Download,
  FolderInput,
  LoaderCircle,
  Plus,
  PanelLeftClose,
  Play,
  Redo2,
  RotateCcw,
  LogOut,
  Share2,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";

import { EditorSidebar } from "@/components/layout/editor-sidebar";
import { HistoryPanel } from "@/components/layout/history-panel";
import { NextFlowLogo } from "@/components/ui/nextflow-logo";
import { WorkflowNode } from "@/components/ui/workflow-node";
import { canConnectNodes, wouldCreateCycle } from "@/features/nodes/node-utils";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";
import type { WorkflowNodeKind } from "@/types/node";

const nodeTypes = {
  workflowNode: WorkflowNode,
};

function FlowCanvas() {
  const { screenToFlowPosition } = useReactFlow();
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const viewport = useWorkflowStore((state) => state.viewport);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowStore((state) => state.onConnect);
  const addNodeAtPosition = useWorkflowStore((state) => state.addNodeAtPosition);
  const setViewport = useWorkflowStore((state) => state.setViewport);
  const setSelectedNodeIds = useWorkflowStore((state) => state.setSelectedNodeIds);
  const setSelectedNodeId = useWorkflowStore((state) => state.setSelectedNodeId);
  const selectedNodeIds = useWorkflowStore((state) => state.selectedNodeIds);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const isValidConnection = (connection: Edge | Connection) => {
    const normalizedConnection: Connection = {
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? null,
      targetHandle: connection.targetHandle ?? null,
    };

    return (
      canConnectNodes(nodes, normalizedConnection) &&
      !wouldCreateCycle(nodes, edges, normalizedConnection)
    );
  };

  const handleViewportChange = (_event: unknown, currentViewport: typeof viewport) => {
    if (
      viewport.x === currentViewport.x &&
      viewport.y === currentViewport.y &&
      viewport.zoom === currentViewport.zoom
    ) {
      return;
    }

    setViewport(currentViewport);
  };

  const handleSelectionChange = ({
    nodes: selectedNodes,
  }: {
    nodes: Array<{ id: string }>;
  }) => {
    const nextSelectedNodeIds = selectedNodes.map((node) => node.id);
    const nextSelectedNodeId = nextSelectedNodeIds[0] ?? null;
    const isSameSelection =
      nextSelectedNodeIds.length === selectedNodeIds.length &&
      nextSelectedNodeIds.every((nodeId, index) => nodeId === selectedNodeIds[index]);

    if (!isSameSelection) {
      setSelectedNodeIds(nextSelectedNodeIds);
    }

    if (selectedNodeId !== nextSelectedNodeId) {
      setSelectedNodeId(nextSelectedNodeId);
    }
  };

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
      nodeTypes={nodeTypes}
      nodes={nodes}
      edges={edges}
      defaultViewport={viewport}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={isValidConnection}
      onMoveEnd={handleViewportChange}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        const kind = event.dataTransfer.getData(
          "application/nextflow-node-kind",
        ) as WorkflowNodeKind;

        if (!kind) {
          return;
        }

        addNodeAtPosition(
          kind,
          screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          }),
        );
      }}
      onSelectionChange={handleSelectionChange}
      deleteKeyCode={null}
      multiSelectionKeyCode={["Meta", "Control"]}
      minZoom={0.35}
      maxZoom={1.2}
      className="nextflow-react-flow"
      connectionLineStyle={{ stroke: "#8b5cf6", strokeWidth: 2 }}
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

type WorkspaceShellProps = {
  isPending?: boolean;
  onCreateWorkflow?: () => void | Promise<void>;
  onDeleteWorkflow?: () => void | Promise<void>;
  onExportWorkflow?: () => void;
  onImportWorkflow?: (file: File) => void | Promise<void>;
  onOpenWorkflow?: (workflowId: string) => void | Promise<void>;
  onResetToSample?: () => void | Promise<void>;
  onRunWorkflow?: (target: "single" | "selected" | "full") => void | Promise<void>;
  onSaveWorkflow?: () => void | Promise<void>;
};

export function WorkspaceShell({
  isPending = false,
  onDeleteWorkflow,
  onCreateWorkflow,
  onExportWorkflow,
  onImportWorkflow,
  onOpenWorkflow,
  onResetToSample,
  onRunWorkflow,
  onSaveWorkflow,
}: WorkspaceShellProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const selectedNodeIds = useWorkflowStore((state) => state.selectedNodeIds);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const canUndo = useWorkflowStore((state) => state.canUndo);
  const canRedo = useWorkflowStore((state) => state.canRedo);
  const workflowName = useWorkflowStore((state) => state.workflowName);
  const workflowDescription = useWorkflowStore(
    (state) => state.workflowDescription,
  );
  const workflows = useWorkflowStore((state) => state.workflows);
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const setWorkflowMeta = useWorkflowStore((state) => state.setWorkflowMeta);

  return (
    <div className="flex min-h-screen flex-col bg-[#050507] text-white">
      <header className="flex items-center justify-between border-b border-white/6 px-6 py-4">
        <div className="flex items-center gap-4">
          <NextFlowLogo />
          <div className="min-w-[320px]">
            <p className="text-xs uppercase tracking-[0.32em] text-white/28">
              NextFlow
            </p>
            <div className="mt-1 flex items-center gap-3">
              <input
                value={workflowName}
                onChange={(event) =>
                  setWorkflowMeta(event.target.value, workflowDescription)
                }
                className="min-w-[240px] bg-transparent text-lg font-semibold tracking-tight text-white outline-none"
              />
              <div className="relative">
                <select
                  value={workflowId}
                  onChange={(event) => onOpenWorkflow?.(event.target.value)}
                  className="appearance-none rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 pr-9 text-sm text-white/68 outline-none transition hover:bg-white/[0.06]"
                >
                  {workflows.map((workflow) => (
                    <option
                      key={workflow.id}
                      value={workflow.id}
                      className="bg-[#09090d]"
                    >
                      {workflow.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              </div>
            </div>
            <input
              value={workflowDescription ?? ""}
              onChange={(event) =>
                setWorkflowMeta(workflowName, event.target.value || null)
              }
              placeholder="Describe this workflow"
              className="mt-1 w-full bg-transparent text-sm text-white/42 outline-none placeholder:text-white/22"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SignOutButton>
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </SignOutButton>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              void onImportWorkflow?.(file);
              event.target.value = "";
            }}
          />
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
            onClick={() => importInputRef.current?.click()}
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white"
          >
            <FolderInput className="h-4 w-4" />
            Import
          </button>
          <button
            type="button"
            onClick={onExportWorkflow}
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={onResetToSample}
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Sample
          </button>
          <button
            type="button"
            onClick={onCreateWorkflow}
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
          <button
            type="button"
            onClick={onSaveWorkflow}
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white"
          >
            {isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={onDeleteWorkflow}
            className="flex h-11 items-center gap-2 rounded-full border border-rose-400/14 bg-rose-500/8 px-4 text-sm text-rose-100 transition hover:bg-rose-500/12"
          >
            <PanelLeftClose className="h-4 w-4" />
            Delete flow
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
            onClick={() => onRunWorkflow?.(selectedNodeIds.length > 0 ? "single" : "full")}
            className="flex h-11 items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 text-sm text-violet-100 transition hover:bg-violet-500/16"
          >
            <Play className="h-4 w-4 fill-current" />
            {selectedNodeIds.length > 0 ? "Run node" : "Quick run"}
          </button>
          <button
            type="button"
            onClick={() => onRunWorkflow?.("selected")}
            disabled={selectedNodeIds.length === 0}
            className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Play className="h-4 w-4 fill-current" />
            Run selected
          </button>
          <button
            type="button"
            onClick={() => onRunWorkflow?.("full")}
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
                <p
                  className={cn(
                    "text-sm text-white/58",
                    isPending && "text-violet-200",
                  )}
                >
                  {isPending
                    ? "Syncing workflow state..."
                    : null}
                  {selectedNodeIds.length > 0
                    ? `${isPending ? " " : ""}${selectedNodeIds.length} node${selectedNodeIds.length === 1 ? "" : "s"} selected`
                    : isPending
                      ? ""
                      : "Drag from the sidebar or click to add nodes. Invalid links are blocked before they connect."}
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
