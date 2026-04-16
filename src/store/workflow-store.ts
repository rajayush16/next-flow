import { create } from "zustand";

type WorkflowStore = {
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
}));
