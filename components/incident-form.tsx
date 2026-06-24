"use client";

import { useState } from "react";
import { addIncident, updateIncident } from "@/lib/firestore";
import { EMPTY_INCIDENT, type Incident } from "@/lib/types";

const FIELDS: { key: keyof typeof EMPTY_INCIDENT; label: string; hint: string }[] = [
  { key: "date", label: "Date", hint: "When did it happen?" },
  {
    key: "trigger",
    label: "Trigger / what happened",
    hint: "Behaviour only — who did/said what, in sequence. No interpretation.",
  },
  { key: "davidDidSaid", label: "What you did and said", hint: "Honestly — tone, timing, withdrawal." },
  { key: "damiDidSaid", label: "What Dami did and said", hint: "As observed — not assumed motives." },
  { key: "davidWanted", label: "What you wanted that you didn't get", hint: "The unmet need under the reaction." },
  { key: "resolution", label: "How it resolved (or didn't)", hint: "" },
  { key: "davidRead", label: "Your read", hint: "Your interpretation — what you think it means." },
  { key: "openQuestion", label: "Open question for the coach", hint: "What you want help thinking about." },
];

type Fields = Omit<Incident, "id" | "createdAt">;

export function IncidentForm({
  initial,
  incidentId,
  onDone,
  onCancel,
}: {
  initial?: Fields;
  incidentId?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Fields>(initial ?? { ...EMPTY_INCIDENT });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (incidentId) await updateIncident(incidentId, form);
      else await addIncident(form);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="animate-rise rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp">
      <p className="font-mono text-[11px] uppercase tracking-eyebrow text-ember">
        {incidentId ? "Edit entry" : "New entry"}
      </p>
      <h2 className="mt-1 font-serif text-2xl text-bone">
        {incidentId ? "Edit incident" : "Log an incident"}
      </h2>
      <p className="mt-1 text-sm text-ash">Structured entries feed straight into the coach&apos;s context.</p>

      <div className="mt-5 space-y-4">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key}>
            <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-smoke">{label}</label>
            {hint && <p className="mt-0.5 text-xs text-smoke">{hint}</p>}
            {key === "date" ? (
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder="e.g. 2026-06-24, or 'last Tuesday'"
                className="mt-1.5 w-full rounded-lg border border-night-hair bg-night-input px-3 py-2 text-bone placeholder:text-smoke/60 outline-none transition focus:border-ember/60"
              />
            ) : (
              <textarea
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                rows={2}
                className="mt-1.5 w-full resize-y rounded-lg border border-night-hair bg-night-input px-3 py-2 text-bone outline-none transition focus:border-ember/60"
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-[#E59A8C]">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-ember px-4 py-2.5 font-medium text-night shadow-glow transition hover:bg-ember-soft disabled:opacity-50"
        >
          {saving ? "Saving…" : incidentId ? "Save changes" : "Save entry"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke transition hover:text-ash"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
