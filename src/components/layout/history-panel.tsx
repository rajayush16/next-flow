"use client";

import {
  ChevronDown,
  Clock3,
  LoaderCircle,
  Logs,
  Sparkles,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

import { RunPayloadSection } from "./run-payload-section";

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
        <p className="type-eyebrow text-white/28">
          Workflow History
        </p>
        <h2 className="type-section-title mt-1 text-white">
          Runs
        </h2>
      </div>

      <div className="nextflow-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
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
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "type-badge rounded-full px-2.5 py-1 uppercase",
                        statusStyles[run.status],
                      )}
                    >
                      {run.status}
                    </span>
                    <span className="type-eyebrow text-white/28">
                      {run.target}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="type-ui-label break-words text-white">
                      {new Date(run.startedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="break-all font-mono text-[11px] tracking-[-0.005em] text-white/28">
                      {run.id}
                    </p>
                  </div>

                  <div className="type-meta flex flex-wrap items-center gap-2 text-white/48">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/8 px-2.5 py-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "In progress"}
                    </span>
                    <span className="type-eyebrow inline-flex items-center gap-1 rounded-full border border-white/8 px-2.5 py-1 text-white/32">
                      <Workflow className="h-3 w-3" />
                      {runTargetLabels[run.target]}
                    </span>
                    <span className="type-eyebrow rounded-full border border-white/8 px-2.5 py-1 text-white/32">
                      {run.scopeNodeIds.length} node{run.scopeNodeIds.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <ChevronDown
                  className={cn(
                    "mt-1 h-4 w-4 shrink-0 text-white/36 transition",
                    expanded && "rotate-180",
                  )}
                />
              </button>

              {expanded ? (
                <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                  {run.nodeRuns.map((nodeRun) => (
                    <article
                      key={nodeRun.id}
                      className="rounded-[24px] border border-white/6 bg-black/18 p-3.5"
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="type-ui-label break-all text-white">
                            {nodeRun.nodeId}
                          </p>
                          <p className="type-eyebrow text-white/28">
                            {nodeRun.nodeKind}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                          <span
                            className={cn(
                              "type-badge rounded-full px-2.5 py-1 uppercase",
                              statusStyles[nodeRun.status],
                            )}
                          >
                            {nodeRun.status}
                          </span>
                          <div className="type-meta inline-flex items-center gap-2 rounded-full border border-white/8 px-2.5 py-1 text-white/48">
                            {nodeRun.status === "running" ? (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            {nodeRun.durationMs
                              ? `${(nodeRun.durationMs / 1000).toFixed(1)}s`
                              : "pending"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <RunPayloadSection
                          label="Input"
                          content={nodeRun.inputSummary}
                          tone="input"
                          icon={Workflow}
                        />
                        <RunPayloadSection
                          label="Output"
                          content={nodeRun.outputSummary}
                          tone="output"
                          icon={Sparkles}
                        />
                        {nodeRun.logs.length > 0 ? (
                          <RunPayloadSection
                            label="Logs"
                            content={nodeRun.logs}
                            tone="logs"
                            icon={Logs}
                          />
                        ) : null}
                      </div>

                      {nodeRun.errorMessage ? (
                        <div className="mt-3 rounded-[20px] border border-rose-400/14 bg-rose-500/[0.06] px-4 py-3">
                          <p className="type-eyebrow text-rose-200/60">
                            Error
                          </p>
                          <p className="mt-2 whitespace-pre-wrap break-words font-mono text-[12.5px] leading-6 text-rose-100/92">
                            {nodeRun.errorMessage}
                          </p>
                        </div>
                      ) : null}
                    </article>
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
