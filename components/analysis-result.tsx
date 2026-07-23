"use client";

import { ChevronDown, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { PATTERN_MAP, SEVERITY_META, SEVERITY_ORDER } from "@/lib/manipulation-patterns";
import type { Analysis, AnalysisFinding } from "@/lib/types";

const CONFIDENCE_LABEL: Record<AnalysisFinding["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function AnalysisResultView({
  analysis,
  onDelete,
}: {
  analysis: Analysis;
  onDelete?: () => void;
}) {
  const { result } = analysis;
  const severeCount = result.findings.filter((f) => PATTERN_MAP.get(f.patternId)?.severity === "severe").length;
  const patternCount = new Set(result.findings.map((f) => f.patternId)).size;
  const sorted = [...result.findings].sort((a, b) => {
    const sa = SEVERITY_ORDER.indexOf(PATTERN_MAP.get(a.patternId)?.severity ?? "moderate");
    const sb = SEVERITY_ORDER.indexOf(PATTERN_MAP.get(b.patternId)?.severity ?? "moderate");
    return sa !== sb ? sa - sb : b.instanceCount - a.instanceCount;
  });

  return (
    <div className="animate-rise space-y-6">
      <header className="rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">
              {new Date(analysis.createdAt).toLocaleString()} · {analysis.sourceLabel} · {analysis.messageCount} messages
            </p>
            <h2 className="mt-1 font-serif text-2xl text-bone">{analysis.title}</h2>
          </div>
          {onDelete && (
            <button onClick={onDelete} className="text-smoke transition hover:text-[#E59A8C]" aria-label="Delete analysis">
              <Trash2 className="h-4 w-4" strokeWidth={1.8} />
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-night-hair border-t border-night-hair pt-5 text-center">
          <Stat value={patternCount} label="Patterns found" tone="text-ember" />
          <Stat value={severeCount} label="Severe" tone="text-[#E59A8C]" />
          <Stat value={result.speakers.length || new Set(result.findings.map((f) => f.speaker)).size} label="Speakers" tone="text-moss" />
        </div>

        {result.overallSummary && (
          <p className="mt-5 border-t border-night-hair pt-5 text-sm leading-relaxed text-ash">{result.overallSummary}</p>
        )}
      </header>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-night-hair p-10 text-center">
          <p className="font-serif text-xl text-bone">No patterns rose to that level</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
            Nothing in this transcript met the bar for the catalogue below. That&apos;s a real result, not a null one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((finding, i) => (
            <PatternCard key={`${finding.patternId}-${i}`} finding={finding} />
          ))}
        </div>
      )}

      <HowToUse />
      <SupportResources />
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="px-2">
      <p className={`font-display text-3xl ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-smoke">{label}</p>
    </div>
  );
}

function PatternCard({ finding }: { finding: AnalysisFinding }) {
  const [open, setOpen] = useState(false);
  const pattern = PATTERN_MAP.get(finding.patternId);
  if (!pattern) return null;
  const meta = SEVERITY_META[pattern.severity];
  const Icon = pattern.icon;

  return (
    <article className={`relative overflow-hidden rounded-2xl border bg-night-raised p-6 shadow-lamp lit-edge ${meta.border}`}>
      <span className={`absolute inset-y-0 left-0 w-px opacity-60 ${meta.dot}`} />
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-4 text-left">
        <div className="flex items-start gap-3.5">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
            <Icon className={`h-5 w-5 ${meta.text}`} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg text-bone">{pattern.name}</h3>
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${meta.border} ${meta.text}`}>
                {meta.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-ash">
              <span className="text-bone">{finding.speaker}</span> · seen {finding.instanceCount}× ·{" "}
              {CONFIDENCE_LABEL[finding.confidence]}
            </p>
          </div>
        </div>
        <ChevronDown className={`mt-2 h-4 w-4 shrink-0 text-smoke transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-night-hair pt-4">
          <p className="text-sm text-smoke">{pattern.summary}</p>

          {finding.explanation && <p className="text-sm leading-relaxed layer-interp">{finding.explanation}</p>}

          {finding.quotes.length > 0 && (
            <div className="space-y-2">
              {finding.quotes.map((q, i) => (
                <blockquote
                  key={i}
                  className="rounded-lg border-l-2 border-dusk/50 bg-night-input px-3.5 py-2.5 text-sm text-ash"
                >
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-smoke">{q.speaker}</span>
                  <p className="mt-1 whitespace-pre-wrap layer-fact">&ldquo;{q.text}&rdquo;</p>
                </blockquote>
              ))}
            </div>
          )}

          {finding.healthyAlternative && (
            <div className="rounded-lg border border-moss/30 bg-moss/[0.06] px-3.5 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-moss">Healthier approach</p>
              <p className="mt-1 text-sm leading-relaxed text-ash">{finding.healthyAlternative}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function HowToUse() {
  return (
    <div className="rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp">
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="h-4 w-4 text-ember" strokeWidth={1.8} />
        <h3 className="font-serif text-lg text-bone">How to read this</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ash">
        This is pattern recognition, not a diagnosis — of a person or of the relationship. Everyone can display some
        of these behaviors occasionally, especially under stress. What matters is frequency, intensity, and
        willingness to change when it&apos;s named. A single incident doesn&apos;t define a pattern.
      </p>
    </div>
  );
}

export function SupportResources() {
  return (
    <div className="rounded-2xl border border-night-hair bg-night-raised p-6 text-center shadow-lamp">
      <h3 className="font-serif text-lg text-bone">Need support?</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ash">
        If you or someone you know is experiencing abuse or manipulation, help is available. These resources provide
        confidential support.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-night-hair px-4 py-3">
          <p className="text-sm font-medium text-bone">National DV Hotline</p>
          <a href="tel:18007997233" className="mt-0.5 block font-mono text-sm text-ember">
            1-800-799-7233
          </a>
        </div>
        <div className="rounded-xl border border-night-hair px-4 py-3">
          <p className="text-sm font-medium text-bone">988 Crisis Lifeline</p>
          <a href="tel:988" className="mt-0.5 block font-mono text-sm text-ember">
            Call or text 988
          </a>
        </div>
      </div>
    </div>
  );
}
