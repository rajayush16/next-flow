"use client";

import { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import {
  CircleX,
  ChevronDown,
  Download,
  FilePenLine,
  FolderInput,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  PanelLeftClose,
  Play,
  Redo2,
  RotateCcw,
  LogOut,
  Share2,
  Sparkles,
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
  const onReconnect = useWorkflowStore((state) => state.onReconnect);
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
      defaultEdgeOptions={{
        interactionWidth: 28,
        selectable: true,
        focusable: true,
        className: "nextflow-edge",
      }}
      defaultViewport={viewport}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onReconnect={onReconnect}
      edgesReconnectable
      reconnectRadius={18}
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
  onCreateWorkflow?: (input: {
    name: string;
    description: string | null;
  }) => void | Promise<void>;
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
  const overflowMenuRef = useRef<HTMLDivElement | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMetaModalOpen, setIsEditMetaModalOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [draftWorkflowName, setDraftWorkflowName] = useState("");
  const [draftWorkflowDescription, setDraftWorkflowDescription] = useState("");
  const selectedNodeIds = useWorkflowStore((state) => state.selectedNodeIds);
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
  const sidebarCollapsed = useWorkflowStore((state) => state.sidebarCollapsed);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!overflowMenuRef.current?.contains(event.target as Node)) {
        setIsOverflowOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const resetCreateWorkflowForm = () => {
    setNewWorkflowName("");
    setNewWorkflowDescription("");
    setIsCreateModalOpen(false);
  };

  const openEditMetaModal = () => {
    setDraftWorkflowName(workflowName);
    setDraftWorkflowDescription(workflowDescription ?? "");
    setIsEditMetaModalOpen(true);
  };

  const resetEditMetaForm = () => {
    setDraftWorkflowName(workflowName);
    setDraftWorkflowDescription(workflowDescription ?? "");
    setIsEditMetaModalOpen(false);
  };

  const visibleActionClass =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm transition disabled:cursor-not-allowed disabled:opacity-35";
  const subtleActionClass =
    "bg-white/[0.02] text-white/56 hover:bg-white/[0.045] hover:text-white/84";
  const workflowSubtitle = workflowDescription?.trim() || "Workflow canvas";

  return (
    <div className="flex h-dvh overflow-hidden bg-[#050507] text-white">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-white/4 px-6 py-5 xl:px-10 xl:py-5 2xl:px-12">
          <div className="grid min-h-[76px] grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.86fr)_auto] xl:items-center xl:gap-10 2xl:gap-14">
            <div className="flex min-w-0 items-center gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <NextFlowLogo className="h-8 w-8 border-0 bg-transparent" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex min-w-0 items-center gap-3">
                  <p className="type-eyebrow shrink-0 text-white/22">
                    NextFlow
                  </p>
                  <span className="hidden h-1 w-1 rounded-full bg-white/14 sm:block" />
                  <p className="type-eyebrow truncate text-white/14">
                    Builder
                  </p>
                </div>
                <input
                  value={workflowName}
                  onChange={(event) =>
                    setWorkflowMeta(event.target.value, workflowDescription)
                  }
                  className="type-card-title w-full min-w-0 bg-transparent text-[1.08rem] text-white outline-none placeholder:text-white/28 xl:text-[1.2rem]"
                />
                <textarea
                  value={workflowDescription ?? ""}
                  onChange={(event) =>
                    setWorkflowMeta(workflowName, event.target.value || null)
                  }
                  placeholder="Describe this workflow"
                  rows={1}
                  className="type-meta h-6 w-full resize-none overflow-hidden bg-transparent text-white/34 outline-none placeholder:text-white/18"
                />
                <p className="sr-only">{workflowSubtitle}</p>
              </div>
            </div>

            <div className="min-w-0 xl:justify-self-center xl:w-full xl:max-w-[460px]">
              <div className="relative">
                <select
                  value={workflowId}
                  onChange={(event) => onOpenWorkflow?.(event.target.value)}
                  className="type-input h-12 w-full appearance-none rounded-full border border-white/6 bg-white/[0.03] px-6 pr-12 font-medium text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition hover:bg-white/[0.045] focus:border-white/10"
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
                <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/32" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2.5 sm:gap-3 xl:justify-end xl:pl-6">
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
                onClick={() => setIsCreateModalOpen(true)}
                  className={cn(visibleActionClass, subtleActionClass, "type-ui-label px-4")}
              >
                <Plus className="h-4 w-4" />
                New
              </button>
              <button
                type="button"
                onClick={onSaveWorkflow}
                className={cn(
                  visibleActionClass,
                  "type-ui-label px-4.5 bg-white/[0.045] text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/[0.07] hover:text-white",
                )}
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
                onClick={() => onRunWorkflow?.("full")}
                className="type-ui-label ml-1 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-black shadow-[0_8px_24px_rgba(255,255,255,0.08)] transition hover:bg-white/92"
              >
                <Play className="h-4 w-4 fill-current" />
                Run workflow
              </button>
              <div className="relative" ref={overflowMenuRef}>
                <button
                  type="button"
                  aria-expanded={isOverflowOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsOverflowOpen((current) => !current)}
                  className={cn(visibleActionClass, subtleActionClass, "w-11 px-0")}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {isOverflowOpen ? (
                  <div className="absolute right-0 top-[calc(100%+14px)] z-30 w-[240px] rounded-[24px] border border-white/6 bg-[#0d0d10]/96 p-2.5 shadow-[0_24px_64px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                    <div className="grid gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          undo();
                        }}
                        disabled={!canUndo}
                        className="type-ui-label flex h-10 items-center gap-3 rounded-[16px] px-3.5 text-white/62 transition hover:bg-white/[0.045] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Undo2 className="h-4 w-4" />
                        Undo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          redo();
                        }}
                        disabled={!canRedo}
                        className="type-ui-label flex h-10 items-center gap-3 rounded-[16px] px-3.5 text-white/62 transition hover:bg-white/[0.045] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Redo2 className="h-4 w-4" />
                        Redo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          openEditMetaModal();
                        }}
                        className="type-ui-label flex h-10 items-center gap-3 rounded-[16px] px-3.5 text-white/62 transition hover:bg-white/[0.045] hover:text-white"
                      >
                        <FilePenLine className="h-4 w-4" />
                        Edit details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          importInputRef.current?.click();
                        }}
                        className="type-ui-label flex h-10 items-center gap-3 rounded-[16px] px-3.5 text-white/62 transition hover:bg-white/[0.045] hover:text-white"
                      >
                        <FolderInput className="h-4 w-4" />
                        Import
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          onExportWorkflow?.();
                        }}
                        className="type-ui-label flex h-10 items-center gap-3 rounded-[16px] px-3.5 text-white/62 transition hover:bg-white/[0.045] hover:text-white"
                      >
                        <Download className="h-4 w-4" />
                        Export
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          onResetToSample?.();
                        }}
                        className="type-ui-label flex h-10 items-center gap-3 rounded-[16px] px-3.5 text-white/62 transition hover:bg-white/[0.045] hover:text-white"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Sample
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          onRunWorkflow?.(selectedNodeIds.length > 0 ? "single" : "full");
                        }}
                        className="type-ui-label flex h-10 items-center gap-3 rounded-[16px] px-3.5 text-white/62 transition hover:bg-white/[0.045] hover:text-white"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        Quick run
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          onRunWorkflow?.("selected");
                        }}
                        disabled={selectedNodeIds.length === 0}
                        className="type-ui-label flex h-10 items-center gap-3 rounded-[16px] px-3.5 text-white/62 transition hover:bg-white/[0.045] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        Run selected
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          onDeleteWorkflow?.();
                        }}
                        className="type-ui-label mt-1 flex h-10 items-center gap-3 rounded-[16px] px-3.5 text-rose-100/78 transition hover:bg-rose-500/[0.08]"
                      >
                        <PanelLeftClose className="h-4 w-4" />
                        Delete flow
                      </button>
                      <SignOutButton>
                        <button
                          type="button"
                          onClick={() => setIsOverflowOpen(false)}
                          className="type-ui-label flex h-10 items-center gap-3 rounded-[16px] px-3.5 text-white/62 transition hover:bg-white/[0.045] hover:text-white"
                        >
                          <LogOut className="h-4 w-4" />
                          Log out
                        </button>
                      </SignOutButton>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

      <main
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-4 py-4 xl:gap-5 xl:overflow-hidden 2xl:gap-6",
          sidebarCollapsed
            ? "xl:grid-cols-[88px_minmax(0,1fr)] 2xl:grid-cols-[88px_minmax(0,1fr)_360px]"
            : "xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[308px_minmax(0,1fr)_360px]",
        )}
      >
        <EditorSidebar />

        <section className="relative min-h-[68vh] min-w-0 overflow-hidden rounded-[32px] border border-white/8 bg-[#07070a] xl:h-full xl:min-h-0">
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between border-b border-white/6 bg-black/28 px-4 py-3 backdrop-blur-xl xl:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                <Sparkles className="h-4 w-4 text-white/68" />
              </div>
              <div>
                <p className="type-eyebrow text-white/28">
                  Workflow Builder
                </p>
                <p
                  className={cn(
                    "type-meta text-white/58",
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

          <div className="h-full min-h-0 pt-[73px]">
            <ReactFlowProvider>
              <FlowCanvas />
            </ReactFlowProvider>
          </div>
        </section>

        <div className="min-h-0 xl:col-span-2 2xl:col-span-1">
          <HistoryPanel />
        </div>
      </main>
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/8 bg-[#0d0d10] p-6 shadow-[0_32px_90px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="type-eyebrow text-white/28">
                  New Workflow
                </p>
                <h2 className="type-page-title mt-2 text-white">
                  Name your workflow
                </h2>
                <p className="type-body mt-3 text-white/48">
                  Create the workflow with a real name first, then start building on the canvas.
                </p>
              </div>
              <button
                type="button"
                onClick={resetCreateWorkflowForm}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/54 transition hover:bg-white/[0.06] hover:text-white"
              >
                <CircleX className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="type-eyebrow mb-2 block text-white/34">
                  Workflow name
                </span>
                <input
                  value={newWorkflowName}
                  onChange={(event) => setNewWorkflowName(event.target.value)}
                  placeholder="Product Launch Campaign"
                  className="type-input w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/22 focus:border-violet-400/40"
                />
              </label>

              <label className="block">
                <span className="type-eyebrow mb-2 block text-white/34">
                  Description
                </span>
                <textarea
                  value={newWorkflowDescription}
                  onChange={(event) => setNewWorkflowDescription(event.target.value)}
                  placeholder="Describe what this workflow is intended to do."
                  rows={4}
                  className="type-input w-full resize-none rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/22 focus:border-violet-400/40"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetCreateWorkflowForm}
                className="type-ui-label rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-white/68 transition hover:bg-white/[0.06] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={newWorkflowName.trim().length === 0 || isPending}
                onClick={() => {
                  void onCreateWorkflow?.({
                    name: newWorkflowName.trim(),
                    description: newWorkflowDescription.trim() || null,
                  });
                  resetCreateWorkflowForm();
                }}
                className="type-ui-label rounded-full bg-white px-5 py-3 font-semibold text-[#050507] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Create workflow
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditMetaModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/8 bg-[#0d0d10] p-6 shadow-[0_32px_90px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="type-eyebrow text-white/28">
                  Workflow Details
                </p>
                <h2 className="type-page-title mt-2 text-white">
                  Edit title and description
                </h2>
                <p className="type-body mt-3 text-white/48">
                  Update how this workflow appears in the navbar and selector.
                </p>
              </div>
              <button
                type="button"
                onClick={resetEditMetaForm}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/54 transition hover:bg-white/[0.06] hover:text-white"
              >
                <CircleX className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="type-eyebrow mb-2 block text-white/34">
                  Workflow name
                </span>
                <input
                  value={draftWorkflowName}
                  onChange={(event) => setDraftWorkflowName(event.target.value)}
                  placeholder="Untitled workflow"
                  className="type-input w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/22 focus:border-violet-400/40"
                />
              </label>

              <label className="block">
                <span className="type-eyebrow mb-2 block text-white/34">
                  Description
                </span>
                <textarea
                  value={draftWorkflowDescription}
                  onChange={(event) => setDraftWorkflowDescription(event.target.value)}
                  placeholder="New LLM workflow"
                  rows={3}
                  className="type-input w-full resize-none rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/22 focus:border-violet-400/40"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetEditMetaForm}
                className="type-ui-label rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-white/68 transition hover:bg-white/[0.06] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={draftWorkflowName.trim().length === 0}
                onClick={() => {
                  setWorkflowMeta(
                    draftWorkflowName.trim(),
                    draftWorkflowDescription.trim() || null,
                  );
                  setIsEditMetaModalOpen(false);
                }}
                className="type-ui-label rounded-full bg-white px-5 py-3 font-semibold text-[#050507] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Save details
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
