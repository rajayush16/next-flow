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

type WorkflowStore = {
  nodes: WorkflowEditorNode[];
  edges: Edge[];
  viewport: Viewport;
  runs: WorkflowRun[];
  activeRunId: string | null;
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  sidebarCollapsed: boolean;
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
};

function updateNode<T extends WorkflowEditorNode[]>(
  nodes: T,
  nodeId: string,
  updater: (node: WorkflowEditorNode) => WorkflowEditorNode,
) {
  return nodes.map((node) => (node.id === nodeId ? updater(node) : node)) as T;
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
  onNodesChange: (changes: NodeChange<WorkflowEditorNode>[]) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },
  onEdgesChange: (changes: EdgeChange<Edge>[]) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },
  onConnect: (connection) => {
    const { nodes, edges } = get();

    if (!canConnectNodes(nodes, connection)) {
      return;
    }

    if (wouldCreateCycle(nodes, edges, connection)) {
      return;
    }

    set({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: "#7c3aed", strokeWidth: 2 },
          className: "nextflow-edge",
        },
        edges,
      ),
    });
  },
  updateNodeData: (nodeId, key, value) => {
    set((state) => ({
      nodes: updateNode(state.nodes, nodeId, (node) => ({
        ...node,
        data: {
          ...node.data,
          [key]: value,
        } as WorkflowNodeData,
      })),
    }));
  },
  addNode: (kind) => {
    const template = findNodeTemplate(kind);
    if (!template) {
      return;
    }

    const { nodes } = get();
    const offset = nodes.length * 24;

    set({
      nodes: [
        ...nodes,
        createNodeFromTemplate(template, {
          x: template.position.x + offset,
          y: template.position.y + offset,
        }),
      ],
    });
  },
  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
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
}));
