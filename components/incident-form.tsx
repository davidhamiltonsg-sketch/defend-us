"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { addIncident } from "@/lib/firestore";
import { EMPTY_INCIDENT } from "@/lib/types";

const FIELDS: { key: keyof typeof EMPTY_INCIDENT; label: string; hint: string }[] = [
  { key: "date", label: "Date", hint: "When did it happen?" },
  {
    key: "trigger",
    label: "Trigger / what happened",
    hint: "Behaviour only — who did/said what, in sequence. No interpretation.",
  },
  {
    key: "davidDidSaid",
    label: "What you did and said",
    hint: "Honestly — including tone, timing, withdrawal, anything you're not proud of.",
  },
  {
    key: "damiDidSaid",
    label: "What Dami did and said",
    hint: "As observed — actions and words, not assumed motives.",
  },
  {
    key: "davidWanted",
    label: "What you wanted that you didn't get",
    hint: "The actual unmet need under the reaction.",
  },
  { key: "resolution", label: "How it resolved (or didn't)", hint: "" },
  { key: "davidRead", label: "Your read", hint: "Your interpretation — what you think it means." },
  {
    key: "openQuestion",
    label: "Open question for the coach",
    hint: "What you actually want help thinking about.",
  },
];

export function IncidentForm() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_INCIDENT });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    await addIncident(user.uid, form);
    setForm({ ...EMPTY_INCIDENT });
    setSaving(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 font-medium text-paper transition hover:bg-ink-soft"
      >
        <Plus className="h-4 w-4" /> Log an incident
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-paper-edge bg-paper-card p-5 shadow-sm"
    >
      <h2 className="font-serif text-xl text-ink">New incident</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Structured entries feed straight into the coach&apos;s context.
      </p>

      <div className="mt-4 space-y-4">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-ink">{label}</label>
            {hint && <p className="text-xs text-ink-muted">{hint}</p>}
            {key === "date" ? (
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder="e.g. 2026-06-24, or 'last Tuesday'"
                className="mt-1 w-full rounded-lg border border-paper-edge bg-paper px-3 py-2 text-ink outline-none focus:border-clay-soft"
              />
            ) : (
              <textarea
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                rows={2}
                className="mt-1 w-full resize-y rounded-lg border border-paper-edge bg-paper px-3 py-2 text-ink outline-none focus:border-clay-soft"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-clay px-4 py-2.5 font-medium text-white transition hover:bg-clay/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save incident"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl px-4 py-2.5 text-ink-muted transition hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
