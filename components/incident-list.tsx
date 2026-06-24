"use client";

import Link from "next/link";
import { MessageCircle, Pencil, Scale, Trash2 } from "lucide-react";
import { deleteIncident } from "@/lib/firestore";
import type { Incident } from "@/lib/types";

const ROWS: { key: keyof Incident; label: string }[] = [
  { key: "trigger", label: "Trigger" },
  { key: "davidDidSaid", label: "You" },
  { key: "damiDidSaid", label: "Dami" },
  { key: "davidWanted", label: "Wanted" },
  { key: "resolution", label: "Resolved" },
  { key: "davidRead", label: "Your read" },
  { key: "openQuestion", label: "Open Q" },
];

function incidentSummary(inc: Incident): string {
  const parts = [
    inc.date && `Date: ${inc.date}`,
    inc.trigger && `What happened: ${inc.trigger}`,
    inc.davidDidSaid && `What I did/said: ${inc.davidDidSaid}`,
    inc.damiDidSaid && `What Dami did/said: ${inc.damiDidSaid}`,
    inc.davidWanted && `What I wanted: ${inc.davidWanted}`,
    inc.resolution && `How it resolved: ${inc.resolution}`,
    inc.davidRead && `My read: ${inc.davidRead}`,
    inc.openQuestion && `My open question: ${inc.openQuestion}`,
  ].filter(Boolean);
  return parts.join("\n");
}

function chatHref(seed: string, title: string): string {
  return `/chat?seed=${encodeURIComponent(seed)}&title=${encodeURIComponent(title)}`;
}

export function IncidentList({
  incidents,
  loading,
  onEdit,
  onChanged,
}: {
  incidents: Incident[];
  loading: boolean;
  onEdit: (inc: Incident) => void;
  onChanged: () => void;
}) {
  async function remove(id?: string) {
    if (!id) return;
    if (!confirm("Delete this entry?")) return;
    await deleteIncident(id).catch(() => {});
    onChanged();
  }

  if (loading) {
    return (
      <p className="font-mono text-xs uppercase tracking-eyebrow text-smoke animate-glowpulse">
        reading the record…
      </p>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-night-hair p-10 text-center">
        <p className="font-serif text-xl text-bone">Nothing here yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
          Logging the specifics — in behaviour, not verdicts — keeps the coaching grounded in
          what actually happened.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((inc, i) => {
        const label = inc.date || inc.trigger?.slice(0, 40) || "incident";
        const summary = incidentSummary(inc);
        return (
          <article
            key={inc.id}
            className="relative overflow-hidden rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp"
          >
            <span className="absolute inset-y-0 left-0 w-px bg-dusk opacity-40" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] tracking-wide text-smoke">
                  {String(incidents.length - i).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-lg text-bone">{inc.date || "Undated"}</h3>
              </div>
              <div className="flex items-center gap-3 text-smoke">
                <button onClick={() => onEdit(inc)} className="transition hover:text-ember" aria-label="Edit">
                  <Pencil className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                  onClick={() => remove(inc.id)}
                  className="transition hover:text-[#E59A8C]"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              {ROWS.filter((r) => (inc[r.key] as string)?.trim()).map((r) => (
                <div key={r.key} className="grid grid-cols-[5.5rem_1fr] gap-3">
                  <dt className="font-mono text-[10px] uppercase tracking-wide text-smoke">{r.label}</dt>
                  <dd className="whitespace-pre-wrap text-ash">{inc[r.key] as string}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-night-hair pt-3">
              <Link
                href={chatHref(
                  `I want to think through this incident with you:\n\n${summary}`,
                  `Talk: ${label}`,
                )}
                className="flex items-center gap-1.5 rounded-lg border border-night-hair px-3 py-1.5 text-xs text-ash transition hover:border-ember/40 hover:text-bone"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Talk about this
              </Link>
              <Link
                href={chatHref(
                  `Reconstruct Dami's likely account of this incident, in good faith and without strawmanning. Then tell me where my own read might be running hot.\n\n${summary}`,
                  `Dami's side: ${label}`,
                )}
                className="flex items-center gap-1.5 rounded-lg border border-night-hair px-3 py-1.5 text-xs text-ash transition hover:border-dusk/50 hover:text-bone"
              >
                <Scale className="h-3.5 w-3.5" /> Steelman Dami&apos;s side
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
