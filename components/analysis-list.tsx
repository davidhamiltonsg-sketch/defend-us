"use client";

import { Trash2 } from "lucide-react";
import { PATTERN_MAP } from "@/lib/manipulation-patterns";
import type { Analysis } from "@/lib/types";

export function AnalysisList({
  analyses,
  loading,
  onSelect,
  onDelete,
}: {
  analyses: Analysis[];
  loading: boolean;
  onSelect: (a: Analysis) => void;
  onDelete: (id?: string) => void;
}) {
  if (loading) {
    return (
      <p className="font-mono text-xs uppercase tracking-eyebrow text-smoke animate-glowpulse">reading past analyses…</p>
    );
  }
  if (analyses.length === 0) return null;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">Past analyses</p>
      <div className="mt-3 space-y-2.5">
        {analyses.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            className="group flex w-full items-center justify-between gap-4 rounded-xl border border-night-hair bg-night-raised px-4 py-3 text-left transition hover:border-ember/30"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-bone">{a.title}</p>
              <p className="mt-0.5 text-xs text-smoke">
                {new Date(a.createdAt).toLocaleDateString()} · {a.messageCount} messages · {summarize(a)}
              </p>
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDelete(a.id);
              }}
              className="shrink-0 text-smoke opacity-0 transition group-hover:opacity-100 hover:text-[#E59A8C]"
              role="button"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.8} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function summarize(a: Analysis): string {
  const n = a.result.findings.length;
  if (n === 0) return "no patterns found";
  const severe = a.result.findings.filter((f) => PATTERN_MAP.get(f.patternId)?.severity === "severe").length;
  return severe > 0 ? `${n} pattern${n === 1 ? "" : "s"}, ${severe} severe` : `${n} pattern${n === 1 ? "" : "s"}`;
}
