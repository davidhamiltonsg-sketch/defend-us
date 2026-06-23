"use client";

import { Trash2 } from "lucide-react";
import { deleteIncident } from "@/lib/firestore";
import type { Incident } from "@/lib/types";

const ROWS: { key: keyof Incident; label: string }[] = [
  { key: "trigger", label: "Trigger" },
  { key: "davidDidSaid", label: "You did/said" },
  { key: "damiDidSaid", label: "Dami did/said" },
  { key: "davidWanted", label: "Unmet need" },
  { key: "resolution", label: "Resolution" },
  { key: "davidRead", label: "Your read" },
  { key: "openQuestion", label: "Open question" },
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
    if (!confirm("Delete this incident?")) return;
    await deleteIncident(id).catch(() => {});
    onChanged();
  }

  if (loading) {
    return <p className="text-ink-muted">Loading…</p>;
  }

  if (incidents.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-paper-edge p-8 text-center text-ink-muted">
        No incidents logged yet. Logging the specifics keeps the coaching grounded in what
        actually happened.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((inc) => (
        <article
          key={inc.id}
          className="rounded-2xl border border-paper-edge bg-paper-card p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-serif text-lg text-ink">{inc.date || "Undated"}</h3>
            <button
              onClick={() => remove(inc.id)}
              className="text-ink-muted transition hover:text-clay"
              aria-label="Delete incident"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            {ROWS.filter((r) => (inc[r.key] as string)?.trim()).map((r) => (
              <div key={r.key} className="grid grid-cols-[7.5rem_1fr] gap-3">
                <dt className="text-ink-muted">{r.label}</dt>
                <dd className="whitespace-pre-wrap text-ink-soft">{inc[r.key] as string}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}
