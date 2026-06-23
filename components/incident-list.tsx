"use client";

import { Trash2 } from "lucide-react";
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

export function IncidentList({
  incidents,
  loading,
  onChanged,
}: {
  incidents: Incident[];
  loading: boolean;
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
        <p className="font-serif text-xl text-bone">Nothing logged yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
          Logging the specifics — in behaviour, not verdicts — keeps the coaching grounded in
          what actually happened.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((inc, i) => (
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
            <button
              onClick={() => remove(inc.id)}
              className="text-smoke transition hover:text-[#E59A8C]"
              aria-label="Delete entry"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
          <dl className="mt-4 space-y-2.5 text-sm">
            {ROWS.filter((r) => (inc[r.key] as string)?.trim()).map((r) => (
              <div key={r.key} className="grid grid-cols-[5.5rem_1fr] gap-3">
                <dt className="font-mono text-[10px] uppercase tracking-wide text-smoke">
                  {r.label}
                </dt>
                <dd className="whitespace-pre-wrap text-ash">{inc[r.key] as string}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}
