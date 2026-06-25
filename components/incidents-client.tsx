"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { List, Plus, Search, Workflow } from "lucide-react";
import { getIncidents } from "@/lib/firestore";
import { IncidentForm } from "./incident-form";
import { IncidentList } from "./incident-list";
import { useToast } from "./ui";
import { EMPTY_INCIDENT, type Incident } from "@/lib/types";

type FormState = { mode: "add" } | { mode: "edit"; incident: Incident } | null;

export function IncidentsClient() {
  const toast = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "timeline">("list");

  const refresh = useCallback(async () => {
    try {
      setIncidents(await getIncidents());
    } catch {
      /* keep current list */
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
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">The record</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-bone">Incident log</h1>
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
            const edit = form.mode === "edit";
            setForm(null);
            refresh();
            toast(edit ? "Entry updated" : "Logged to your record");
          }}
          onCancel={() => setForm(null)}
        />
      )}

      {incidents.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-night-hair bg-night-raised px-3 py-2">
            <Search className="h-4 w-4 text-smoke" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the log…"
              className="flex-1 bg-transparent text-sm text-bone placeholder:text-smoke/70 outline-none"
            />
          </div>
          <div className="flex rounded-xl border border-night-hair p-1">
            <ToggleBtn active={view === "list"} onClick={() => setView("list")} icon={List} label="List" />
            <ToggleBtn active={view === "timeline"} onClick={() => setView("timeline")} icon={Workflow} label="Timeline" />
          </div>
        </div>
      )}

      <IncidentList
        incidents={filtered}
        loading={loading}
        view={view}
        onEdit={(incident) => setForm({ mode: "edit", incident })}
        onChanged={refresh}
      />
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof List;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
        active ? "bg-night-input text-ember" : "text-smoke hover:text-ash"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.8} /> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
