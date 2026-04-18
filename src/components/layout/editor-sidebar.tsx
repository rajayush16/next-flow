"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Crop,
  Film,
  Image as ImageIcon,
  Search,
  Sparkles,
  Type,
} from "lucide-react";

import { workflowNodeTemplates } from "@/features/nodes/node-templates";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

const iconMap = {
  "align-left": Type,
  image: ImageIcon,
  film: Film,
  sparkles: Sparkles,
  crop: Crop,
  clapperboard: Clapperboard,
};

export function EditorSidebar() {
  const addNode = useWorkflowStore((state) => state.addNode);
  const sidebarCollapsed = useWorkflowStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useWorkflowStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        "relative flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-[30px] border border-white/8 bg-[#0d0d10]/96 p-4 shadow-[0_24px_64px_rgba(0,0,0,0.42)] backdrop-blur-xl transition-all duration-300 xl:min-h-0",
        sidebarCollapsed
          ? "xl:w-[88px]"
          : "xl:w-[280px] 2xl:w-[308px]",
      )}
    >
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div className={cn("transition-opacity", sidebarCollapsed && "opacity-0")}>
          <p className="text-xs uppercase tracking-[0.32em] text-white/28">
            Quick Access
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
            Nodes
          </h2>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-white/55 transition hover:bg-white/[0.06] hover:text-white"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {!sidebarCollapsed ? (
        <div className="mb-5 shrink-0 flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-white/40">
          <Search className="h-4 w-4" />
          Search nodes
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {workflowNodeTemplates.map((template) => {
          const Icon = iconMap[template.icon];

          return (
            <button
              key={template.kind}
              type="button"
              onClick={() => addNode(template.kind)}
              onDragStart={(event) => {
                event.dataTransfer.setData("application/nextflow-node-kind", template.kind);
                event.dataTransfer.effectAllowed = "move";
              }}
              className={cn(
                "group flex w-full items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition hover:border-white/14 hover:bg-white/[0.055]",
                sidebarCollapsed && "justify-center px-0",
              )}
              draggable
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${template.accent}22` }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {template.title}
                  </p>
                  <p className="truncate text-xs text-white/38">
                    {template.subtitle}
                  </p>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
