"use client";

import { CheckCircle2, ChevronDown, Download, Library, ShieldAlert, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  FINDING_SEVERITY_META,
  FREQUENCY_LABEL,
  HEALTHY_PATTERNS,
  HEALTHY_PATTERN_MAP,
  PATTERN_MAP,
  PATTERNS,
  RISK_META,
  RISK_ORDER,
  SEVERITY_ORDER,
} from "@/lib/manipulation-patterns";
import { TensionChart } from "./tension-chart";
import type { Analysis, AnalysisFinding, HealthyFinding } from "@/lib/types";

export function AnalysisResultView({
  analysis,
  onDelete,
}: {
  analysis: Analysis;
  onDelete?: () => void;
}) {
  const { result } = analysis;
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    if (!expandAll) return;
    const t = setTimeout(() => window.print(), 60);
    const reset = () => setExpandAll(false);
    window.addEventListener("afterprint", reset);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", reset);
    };
  }, [expandAll]);

  const severeCount = result.findings.filter((f) => f.severity === "serious").length;
  const patternCount = new Set(result.findings.map((f) => f.patternId)).size;
  const sortedFindings = [...result.findings].sort((a, b) => {
    const sa = SEVERITY_ORDER.indexOf(PATTERN_MAP.get(a.patternId)?.severity ?? "moderate");
    const sb = SEVERITY_ORDER.indexOf(PATTERN_MAP.get(b.patternId)?.severity ?? "moderate");
    return sa !== sb ? sa - sb : b.frequency.localeCompare(a.frequency);
  });
  const risk = RISK_META[result.riskLevel];
  const riskPct = ((RISK_ORDER.indexOf(result.riskLevel) + 1) / RISK_ORDER.length) * 100;

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
          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={() => setExpandAll(true)}
              className="flex items-center gap-1.5 rounded-lg border border-night-hair px-3 py-1.5 text-xs text-ash transition hover:border-ember/40 hover:text-bone"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.8} /> Download PDF report
            </button>
            {onDelete && (
              <button onClick={onDelete} className="text-smoke transition hover:text-[#E59A8C]" aria-label="Delete analysis">
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>

        {analysis.sampled && (
          <p className="mt-4 rounded-lg border border-dusk/30 bg-dusk/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-ash">
            This conversation was too long to send in full ({analysis.messageCount.toLocaleString()} messages).
            An evenly-spaced sample of {analysis.analyzedMessageCount.toLocaleString()} messages — spanning the
            entire conversation from start to end, not just one part of it — was analyzed instead.
          </p>
        )}

        <div className="mt-5 grid gap-4 border-t border-night-hair pt-5 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-eyebrow text-smoke">Risk assessment</p>
            <p className={`mt-1 font-display text-3xl ${risk.text}`}>{risk.label}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-night-input">
              <div className={`h-full rounded-full ${risk.bar}`} style={{ width: `${riskPct}%` }} />
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-eyebrow text-smoke">Confidence</p>
            <p className="mt-1 font-display text-3xl capitalize text-bone">{result.confidence}</p>
            <p className="mt-2 text-xs text-smoke">Based on transcript length and how clearly the evidence maps to the catalogue below.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-night-hair border-t border-night-hair pt-5 text-center">
          <Stat value={patternCount} label="Concerning patterns" tone="text-ember" />
          <Stat value={severeCount} label="Serious" tone="text-[#E59A8C]" />
          <Stat value={result.healthyFindings.length} label="Healthy patterns" tone="text-moss" />
        </div>
      </header>

      {result.tensionTimeline.length > 0 && (
        <section className="rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp">
          <h3 className="font-serif text-lg text-bone">Tension Timeline</h3>
          <p className="mt-1 text-sm text-smoke">Concern levels across conversation segments</p>
          <div className="mt-5">
            <TensionChart points={result.tensionTimeline} />
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp">
        <h3 className="font-serif text-lg text-bone">Detailed Analysis</h3>
        <NarrativeBlock heading="Communication Pattern Analysis" text={result.overallSummary} />
        <NarrativeBlock heading="Positive Observations" text={result.positiveObservations} tone="layer-fact" />
        <NarrativeBlock heading="Areas of Concern" text={result.areasOfConcern} />
        <NarrativeBlock heading="Tension Patterns" text={result.tensionPatterns} />
      </section>

      {sortedFindings.length === 0 && result.healthyFindings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-night-hair p-10 text-center">
          <p className="font-serif text-xl text-bone">Nothing rose to the level of a pattern</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
            Neither the concerning nor the healthy catalogue below matched this transcript clearly enough to report.
          </p>
        </div>
      ) : (
        <>
          {sortedFindings.length > 0 && (
            <section>
              <SectionHeading dotClass="bg-[#E59A8C]" label="Concerning Patterns" />
              <div className="mt-3 space-y-4">
                {sortedFindings.map((finding, i) => (
                  <FindingCard key={`${finding.patternId}-${i}`} finding={finding} expandAll={expandAll} />
                ))}
              </div>
            </section>
          )}

          {result.healthyFindings.length > 0 && (
            <section>
              <SectionHeading dotClass="bg-moss" label="Healthy Patterns" />
              <div className="mt-3 space-y-4">
                {result.healthyFindings.map((finding, i) => (
                  <HealthyCard key={`${finding.patternId}-${i}`} finding={finding} expandAll={expandAll} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {result.recommendations.length > 0 && (
        <section className="rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp">
          <h3 className="font-serif text-lg text-bone">Recommendations</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-ash">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                <span className="leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SourcesPanel expandAll={expandAll} />
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

function SectionHeading({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <h3 className="font-serif text-xl text-bone">{label}</h3>
    </div>
  );
}

function NarrativeBlock({ heading, text, tone }: { heading: string; text: string; tone?: string }) {
  if (!text.trim()) return null;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-eyebrow text-smoke">{heading}</p>
      <p className={`mt-1.5 text-sm leading-relaxed ${tone ?? "text-ash"}`}>{text}</p>
    </div>
  );
}

function FindingCard({ finding, expandAll }: { finding: AnalysisFinding; expandAll: boolean }) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = expandAll || localOpen;
  const pattern = PATTERN_MAP.get(finding.patternId);
  if (!pattern) return null;
  const sevMeta = FINDING_SEVERITY_META[finding.severity];
  const Icon = pattern.icon;

  return (
    <article className={`relative overflow-hidden rounded-2xl border bg-night-raised p-6 shadow-lamp lit-edge ${sevMeta.border}`}>
      <span className={`absolute inset-y-0 left-0 w-px opacity-60 ${sevMeta.bg.replace("/10", "")}`} />
      <button onClick={() => setLocalOpen((o) => !o)} className="flex w-full items-start justify-between gap-4 text-left">
        <div className="flex items-start gap-3.5">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sevMeta.bg}`}>
            <Icon className={`h-5 w-5 ${sevMeta.text}`} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-serif text-lg text-bone">{finding.title || pattern.name}</h4>
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${sevMeta.border} ${sevMeta.text}`}>
                {sevMeta.label}
              </span>
              <span className="rounded-full border border-night-hair px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-smoke">
                {FREQUENCY_LABEL[finding.frequency]}
              </span>
            </div>
            <p className="mt-1 text-sm text-ash">
              Attributed to: <span className="text-bone">{finding.attribution}</span>
              <span className="mx-1.5 text-smoke">·</span>
              <span className="text-smoke">{pattern.name}</span>
            </p>
          </div>
        </div>
        <ChevronDown className={`mt-2 h-4 w-4 shrink-0 text-smoke transition print:hidden ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-night-hair pt-4">
          <p className="text-sm text-smoke">{pattern.summary}</p>
          <p className="font-mono text-[10px] text-smoke/80">{pattern.citation}</p>

          {finding.explanation && <p className="text-sm leading-relaxed layer-interp">{finding.explanation}</p>}

          <QuoteList quotes={finding.quotes} />

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

function HealthyCard({ finding, expandAll }: { finding: HealthyFinding; expandAll: boolean }) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = expandAll || localOpen;
  const pattern = HEALTHY_PATTERN_MAP.get(finding.patternId);
  if (!pattern) return null;
  const Icon = pattern.icon;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-moss/30 bg-night-raised p-6 shadow-lamp lit-edge">
      <span className="absolute inset-y-0 left-0 w-px bg-moss opacity-60" />
      <button onClick={() => setLocalOpen((o) => !o)} className="flex w-full items-start justify-between gap-4 text-left">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-moss/10">
            <CheckCircle2 className="h-5 w-5 text-moss" strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-serif text-lg text-bone">{finding.title || pattern.name}</h4>
              <span className="rounded-full border border-moss/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-moss">
                {FREQUENCY_LABEL[finding.frequency]}
              </span>
            </div>
            <p className="mt-1 text-sm text-ash">
              Attributed to: <span className="text-bone">{finding.attribution}</span>
              <span className="mx-1.5 text-smoke">·</span>
              <span className="text-smoke">{pattern.name}</span>
            </p>
          </div>
        </div>
        <ChevronDown className={`mt-2 h-4 w-4 shrink-0 text-smoke transition print:hidden ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-night-hair pt-4">
          <p className="text-sm text-smoke">{pattern.summary}</p>
          <p className="font-mono text-[10px] text-smoke/80">{pattern.citation}</p>
          {finding.explanation && <p className="text-sm leading-relaxed layer-interp">{finding.explanation}</p>}
          <QuoteList quotes={finding.quotes} />
        </div>
      )}
    </article>
  );
}

function QuoteList({ quotes }: { quotes: { speaker: string; text: string }[] }) {
  if (quotes.length === 0) return null;
  return (
    <div className="space-y-2">
      {quotes.map((q, i) => (
        <blockquote key={i} className="rounded-lg border-l-2 border-dusk/50 bg-night-input px-3.5 py-2.5 text-sm text-ash">
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-smoke">{q.speaker}</span>
          <p className="mt-1 whitespace-pre-wrap layer-fact">&ldquo;{q.text}&rdquo;</p>
        </blockquote>
      ))}
    </div>
  );
}

function SourcesPanel({ expandAll }: { expandAll: boolean }) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = expandAll || localOpen;
  return (
    <div className="rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp">
      <button onClick={() => setLocalOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-2.5">
          <Library className="h-4 w-4 text-dusk" strokeWidth={1.8} />
          <h3 className="font-serif text-lg text-bone">Methodology &amp; sources</h3>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-smoke transition print:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      <p className="mt-2 text-sm leading-relaxed text-ash">
        Every pattern below is defined against a named, published source rather than intuition. Where a popular term
        has no rigorous peer-reviewed origin (love bombing, future faking, weaponized incompetence), that's stated
        explicitly rather than inventing a false citation.
      </p>
      {open && (
        <div className="mt-4 grid gap-x-8 gap-y-5 border-t border-night-hair pt-4 sm:grid-cols-2 print:grid-cols-1">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-eyebrow text-[#E59A8C]">Concerning patterns</p>
            <dl className="mt-2 space-y-2.5">
              {PATTERNS.map((p) => (
                <div key={p.id}>
                  <dt className="text-sm text-bone">{p.name}</dt>
                  <dd className="font-mono text-[10px] leading-snug text-smoke">{p.citation}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-eyebrow text-moss">Healthy patterns</p>
            <dl className="mt-2 space-y-2.5">
              {HEALTHY_PATTERNS.map((p) => (
                <div key={p.id}>
                  <dt className="text-sm text-bone">{p.name}</dt>
                  <dd className="font-mono text-[10px] leading-snug text-smoke">{p.citation}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
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
        This is pattern recognition, not a diagnosis — of a person or of the relationship. Both speakers are held to
        the same evidentiary bar; a clean result for one side and findings for the other reflects what the transcript
        actually shows, not an assumption about who's at fault. Everyone can display some of these behaviors
        occasionally, especially under stress — what matters is frequency, severity, and willingness to change when
        it's named. A single incident doesn't define a pattern.
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
