"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { getIncidents } from "@/lib/firestore";
import { IncidentForm } from "./incident-form";
import { IncidentList } from "./incident-list";
import { EMPTY_INCIDENT, type Incident } from "@/lib/types";

type FormState = { mode: "add" } | { mode: "edit"; incident: Incident } | null;

export function IncidentsClient() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(null);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    try {
      setIncidents(await getIncidents());
    } catch {
      // keep the current list on a transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return incidents;
    return incidents.filter((inc) =>
      Object.values(inc).some((v) => typeof v === "string" && v.toLowerCase().includes(q)),
    );
  }, [incidents, query]);

  return (
    <div className="space-y-7 animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">The record</p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight text-bone">Incident log</h1>
          <p className="mt-2 max-w-xl text-ash">
            The specifics, in sequence. Theory without incident produces horoscopes.
          </p>
        </div>
        {!form && (
          <button
            onClick={() => setForm({ mode: "add" })}
            className="flex items-center gap-2 rounded-xl bg-ember px-4 py-2.5 font-medium text-night shadow-glow transition hover:bg-ember-soft"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} /> Log an incident
          </button>
        )}
      </header>

      {form && (
        <IncidentForm
          key={form.mode === "edit" ? form.incident.id : "add"}
          initial={
            form.mode === "edit"
              ? (({ id, createdAt, ...rest }) => rest)(form.incident)
              : { ...EMPTY_INCIDENT }
          }
          incidentId={form.mode === "edit" ? form.incident.id : undefined}
          onDone={() => {
            setForm(null);
            refresh();
          }}
          onCancel={() => setForm(null)}
        />
      )}

      {incidents.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-night-hair bg-night-raised px-3 py-2">
          <Search className="h-4 w-4 text-smoke" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the log…"
            className="flex-1 bg-transparent text-sm text-bone placeholder:text-smoke/70 outline-none"
          />
        </div>
      )}

      <IncidentList
        incidents={filtered}
        loading={loading}
        onEdit={(incident) => setForm({ mode: "edit", incident })}
        onChanged={refresh}
      />
    </div>
  );
}
