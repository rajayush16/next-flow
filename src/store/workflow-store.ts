import type {
  Connection,
  Edge,
  EdgeChange,
  NodeChange,
  OnEdgesChange,
  OnNodesChange,
  Viewport,
} from "@xyflow/react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import { create } from "zustand";

import {
  canConnectNodes,
  createNodeFromTemplate,
  findNodeTemplate,
  wouldCreateCycle,
} from "@/features/nodes/node-utils";
import {
  sampleWorkflow,
  sampleWorkflowRuns,
} from "@/features/workflow/sample-workflow";
import type {
  WorkflowEditorNode,
  WorkflowNodeData,
  WorkflowNodeKind,
} from "@/types/node";
import type { WorkflowRun } from "@/types/workflow";

type WorkflowSnapshot = {
  nodes: WorkflowEditorNode[];
  edges: Edge[];
  viewport: Viewport;
};

type WorkflowStore = {
  nodes: WorkflowEditorNode[];
  edges: Edge[];
  viewport: Viewport;
  runs: WorkflowRun[];
  activeRunId: string | null;
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  sidebarCollapsed: boolean;
  past: WorkflowSnapshot[];
  future: WorkflowSnapshot[];
  onNodesChange: OnNodesChange<WorkflowEditorNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: (connection: Connection) => void;
  updateNodeData: (nodeId: string, key: string, value: unknown) => void;
  addNode: (kind: WorkflowNodeKind) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedNodeIds: (nodeIds: string[]) => void;
  setActiveRunId: (runId: string | null) => void;
  setViewport: (viewport: Viewport) => void;
  toggleSidebar: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

function updateNode<T extends WorkflowEditorNode[]>(
  nodes: T,
  nodeId: string,
  updater: (node: WorkflowEditorNode) => WorkflowEditorNode,
) {
  return nodes.map((node) => (node.id === nodeId ? updater(node) : node)) as T;
}

function cloneSnapshot(snapshot: WorkflowSnapshot): WorkflowSnapshot {
  return structuredClone(snapshot);
}

function currentSnapshot(state: Pick<WorkflowStore, "nodes" | "edges" | "viewport">) {
  return cloneSnapshot({
    nodes: state.nodes,
    edges: state.edges,
    viewport: state.viewport,
  });
}

function commitSnapshot(
  state: WorkflowStore,
  next: Partial<WorkflowSnapshot>,
): Pick<WorkflowStore, "nodes" | "edges" | "viewport" | "past" | "future" | "canUndo" | "canRedo"> {
  const snapshot = currentSnapshot(state);
  const nodes = next.nodes ?? state.nodes;
  const edges = next.edges ?? state.edges;
  const viewport = next.viewport ?? state.viewport;
  const past = [...state.past, snapshot].slice(-50);

  return {
    nodes,
    edges,
    viewport,
    past,
    future: [],
    canUndo: past.length > 0,
    canRedo: false,
  };
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: sampleWorkflow.nodes,
  edges: sampleWorkflow.edges,
  viewport: sampleWorkflow.viewport,
  runs: sampleWorkflowRuns,
  activeRunId: sampleWorkflowRuns[0]?.id ?? null,
  selectedNodeId: null,
  selectedNodeIds: [],
  sidebarCollapsed: false,
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
  onNodesChange: (changes: NodeChange<WorkflowEditorNode>[]) => {
    set((state) => {
      const nextNodes = applyNodeChanges(changes, state.nodes);
      return commitSnapshot(state, { nodes: nextNodes });
    });
  },
  onEdgesChange: (changes: EdgeChange<Edge>[]) => {
    set((state) => {
      const nextEdges = applyEdgeChanges(changes, state.edges);
      return commitSnapshot(state, { edges: nextEdges });
    });
  },
  onConnect: (connection) => {
    const { nodes, edges } = get();

    if (!canConnectNodes(nodes, connection)) {
      return;
    }

    if (wouldCreateCycle(nodes, edges, connection)) {
      return;
    }

    set((state) =>
      commitSnapshot(state, {
        edges: addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#7c3aed", strokeWidth: 2 },
            className: "nextflow-edge",
          },
          edges,
        ),
      }),
    );
  },
  updateNodeData: (nodeId, key, value) => {
    set((state) =>
      commitSnapshot(state, {
        nodes: updateNode(state.nodes, nodeId, (node) => ({
          ...node,
          data: {
            ...node.data,
            [key]: value,
          } as WorkflowNodeData,
        })),
      }),
    );
  },
  addNode: (kind) => {
    const template = findNodeTemplate(kind);
    if (!template) {
      return;
    }

    const { nodes } = get();
    const offset = nodes.length * 24;

    set((state) =>
      commitSnapshot(state, {
        nodes: [
          ...nodes,
          createNodeFromTemplate(template, {
            x: template.position.x + offset,
            y: template.position.y + offset,
          }),
        ],
      }),
    );
  },
  deleteNode: (nodeId) => {
    set((state) => ({
      ...commitSnapshot(state, {
        nodes: state.nodes.filter((node) => node.id !== nodeId),
        edges: state.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        ),
      }),
      selectedNodeId:
        state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
    }));
  },
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setSelectedNodeIds: (selectedNodeIds) => set({ selectedNodeIds }),
  setActiveRunId: (activeRunId) => set({ activeRunId }),
  setViewport: (viewport) => set({ viewport }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  undo: () => {
    const { past, future } = get();
    const previous = past.at(-1);

    if (!previous) {
      return;
    }

    set((state) => {
      const snapshot = currentSnapshot(state);
      const nextPast = state.past.slice(0, -1);

      return {
        ...previous,
        past: nextPast,
        future: [snapshot, ...future].slice(0, 50),
        canUndo: nextPast.length > 0,
        canRedo: true,
      };
    });
  },
  redo: () => {
    const { future } = get();
    const next = future[0];

    if (!next) {
      return;
    }

    set((state) => {
      const snapshot = currentSnapshot(state);
      const nextFuture = state.future.slice(1);
      const past = [...state.past, snapshot].slice(-50);

      return {
        ...next,
        past,
        future: nextFuture,
        canUndo: true,
        canRedo: nextFuture.length > 0,
      };
    });
  },
}));
