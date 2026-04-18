"use client";

import { ChevronDown, Clock3, LoaderCircle, Logs, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

const statusStyles = {
  success: "bg-emerald-500/16 text-emerald-200",
  failed: "bg-rose-500/16 text-rose-200",
  partial: "bg-amber-500/16 text-amber-100",
  running: "bg-violet-500/18 text-violet-100",
  idle: "bg-white/8 text-white/50",
  queued: "bg-sky-500/16 text-sky-100",
};

const runTargetLabels = {
  full: "Full workflow",
  selected: "Selected nodes",
  single: "Single node",
};

export function HistoryPanel() {
  const runs = useWorkflowStore((state) => state.runs);
  const activeRunId = useWorkflowStore((state) => state.activeRunId);
  const setActiveRunId = useWorkflowStore((state) => state.setActiveRunId);

  return (
    <aside className="flex h-full min-h-[220px] w-full flex-col overflow-hidden rounded-[30px] border border-white/8 bg-[#0d0d10]/96 p-4 shadow-[0_24px_64px_rgba(0,0,0,0.42)] backdrop-blur-xl xl:min-h-0 2xl:w-[360px]">
      <div className="mb-6 shrink-0">
        <p className="text-xs uppercase tracking-[0.32em] text-white/28">
          Workflow History
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
          Runs
        </h2>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {runs.map((run) => {
          const expanded = run.id === activeRunId;

          return (
            <section
              key={run.id}
              className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4"
            >
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() => setActiveRunId(expanded ? null : run.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em]",
                        statusStyles[run.status],
                      )}
                    >
                      {run.status}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.24em] text-white/28">
                      {run.target}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {new Date(run.startedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-white/42">
                    <Clock3 className="h-3.5 w-3.5" />
                    {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "In progress"}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/28">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/8 px-2.5 py-1">
                      <Workflow className="h-3 w-3" />
                      {runTargetLabels[run.target]}
                    </span>
                    <span className="rounded-full border border-white/8 px-2.5 py-1">
                      {run.scopeNodeIds.length} node{run.scopeNodeIds.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <ChevronDown
                  className={cn(
                    "mt-1 h-4 w-4 text-white/36 transition",
                    expanded && "rotate-180",
                  )}
                />
              </button>

              {expanded ? (
                <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                  {run.nodeRuns.map((nodeRun) => (
                    <div
                      key={nodeRun.id}
                      className="rounded-2xl border border-white/6 bg-black/18 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {nodeRun.nodeId}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/28">
                            {nodeRun.nodeKind}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]",
                              statusStyles[nodeRun.status],
                            )}
                          >
                            {nodeRun.status}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-white/44">
                            {nodeRun.status === "running" ? (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            {nodeRun.durationMs
                              ? `${(nodeRun.durationMs / 1000).toFixed(1)}s`
                              : "pending"}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs leading-5 text-white/48">
                        Input: {nodeRun.inputSummary}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/58">
                        Output: {nodeRun.outputSummary}
                      </p>
                      {nodeRun.logs.length > 0 ? (
                        <div className="mt-2 rounded-2xl border border-white/6 bg-white/[0.02] p-3">
                          <p className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/32">
                            <Logs className="h-3 w-3" />
                            Logs
                          </p>
                          <div className="space-y-1.5">
                            {nodeRun.logs.map((log, index) => (
                              <p
                                key={`${nodeRun.id}-log-${index}`}
                                className="text-xs leading-5 text-white/42"
                              >
                                {log}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {nodeRun.errorMessage ? (
                        <p className="mt-2 text-xs leading-5 text-rose-200/90">
                          Error: {nodeRun.errorMessage}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
