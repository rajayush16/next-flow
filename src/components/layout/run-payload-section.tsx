"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Check, ChevronDown, ChevronUp, Copy, Logs, Sparkles, Type } from "lucide-react";

import { cn } from "@/lib/utils";

type RunPayloadSectionProps = {
  label: string;
  content: string | string[];
  tone?: "input" | "output" | "logs";
  icon?: ComponentType<{ className?: string }>;
};

type ParsedPayload =
  | {
      kind: "json";
      rawText: string;
      normalizedText: string;
      prettyText: string;
      parsedValue: unknown;
    }
  | {
      kind: "text";
      rawText: string;
      normalizedText: string;
    };

const collapsedMaxHeightClass = "max-h-56";
const expandedMaxHeightClass = "max-h-[32rem]";

function normalizeEscapedWhitespace(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "  ");
}

function parseJsonSafely(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function stringifyContent(content: string | string[]) {
  return Array.isArray(content) ? content.join("\n") : content;
}

function analyzePayload(content: string | string[]): ParsedPayload {
  const rawText = stringifyContent(content).trim();
  const normalizedText = normalizeEscapedWhitespace(rawText);
  const directJson = parseJsonSafely(rawText);

  if (directJson !== null) {
    const normalizedJson =
      typeof directJson === "string" ? normalizeEscapedWhitespace(directJson) : formatJson(directJson);

    return {
      kind: "json",
      rawText,
      normalizedText,
      prettyText: typeof directJson === "string" ? normalizedJson : formatJson(directJson),
      parsedValue: directJson,
    };
  }

  const normalizedJson = parseJsonSafely(normalizedText);

  if (normalizedJson !== null) {
    return {
      kind: "json",
      rawText,
      normalizedText,
      prettyText:
        typeof normalizedJson === "string"
          ? normalizeEscapedWhitespace(normalizedJson)
          : formatJson(normalizedJson),
      parsedValue: normalizedJson,
    };
  }

  return {
    kind: "text",
    rawText,
    normalizedText,
  };
}

function hasLargePayload(value: string) {
  return value.length > 280 || value.split("\n").length > 8;
}

export function RunPayloadSection({
  label,
  content,
  tone = "input",
  icon: Icon = tone === "logs" ? Logs : Sparkles,
}: RunPayloadSectionProps) {
  const payload = useMemo(() => analyzePayload(content), [content]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [displayMode, setDisplayMode] = useState<"pretty" | "raw">(
    payload.kind === "json" ? "pretty" : "raw",
  );

  useEffect(() => {
    setDisplayMode(payload.kind === "json" ? "pretty" : "raw");
    setIsExpanded(false);
  }, [payload.kind, payload.rawText]);

  const textToRender =
    displayMode === "pretty" && payload.kind === "json" ? payload.prettyText : payload.normalizedText;
  const canPrettyPrint = payload.kind === "json";
  const isLargePayload = hasLargePayload(textToRender);

  async function handleCopy() {
    await navigator.clipboard.writeText(textToRender);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1400);
  }

  return (
    <section className="rounded-[22px] border border-white/6 bg-white/[0.035] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-white/7 pb-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-black/20 text-white/52">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">{label}</p>
            <p className="mt-1 text-xs text-white/42">
              {canPrettyPrint ? (displayMode === "pretty" ? "Pretty formatted" : "Raw payload") : "Raw payload"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {canPrettyPrint ? (
            <button
              type="button"
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[11px] uppercase tracking-[0.18em] transition",
                displayMode === "pretty"
                  ? "border-violet-400/30 bg-violet-500/12 text-violet-100"
                  : "border-white/8 bg-white/[0.03] text-white/44 hover:bg-white/[0.06] hover:text-white/70",
              )}
              onClick={() =>
                setDisplayMode((current) => (current === "pretty" ? "raw" : "pretty"))
              }
            >
              {displayMode === "pretty" ? <Type className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {displayMode === "pretty" ? "Raw" : "Pretty"}
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-3 text-[11px] uppercase tracking-[0.18em] text-white/52 transition hover:bg-white/[0.06] hover:text-white"
            onClick={() => void handleCopy()}
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
            {isCopied ? "Copied" : "Copy"}
          </button>
          {isLargePayload ? (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-3 text-[11px] uppercase tracking-[0.18em] text-white/52 transition hover:bg-white/[0.06] hover:text-white"
              onClick={() => setIsExpanded((current) => !current)}
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "nextflow-scrollbar overflow-y-auto rounded-[18px] border px-4 py-3.5",
          isExpanded ? expandedMaxHeightClass : collapsedMaxHeightClass,
          tone === "input" && "border-sky-400/10 bg-sky-500/[0.05]",
          tone === "output" && "border-violet-400/12 bg-violet-500/[0.06]",
          tone === "logs" && "border-white/7 bg-black/24",
        )}
      >
        <pre
          className={cn(
            "m-0 font-mono text-[12.5px] leading-6 whitespace-pre-wrap break-words",
            tone === "input" && "text-sky-100/78",
            tone === "output" && "text-white/84",
            tone === "logs" && "text-white/66",
          )}
        >
          {textToRender || "No content"}
        </pre>
      </div>
    </section>
  );
}
