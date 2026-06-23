"use client";

import { useCallback, useEffect, useState } from "react";
import { getIncidents } from "@/lib/firestore";
import { IncidentForm } from "./incident-form";
import { IncidentList } from "./incident-list";
import type { Incident } from "@/lib/types";

export function IncidentsClient() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-7 animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">
            The record
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight text-bone">Incident log</h1>
          <p className="mt-2 max-w-xl text-ash">
            The specifics, in sequence. Theory without incident produces horoscopes.
          </p>
        </div>
        <IncidentForm onSaved={refresh} />
      </header>
      <IncidentList incidents={incidents} loading={loading} onChanged={refresh} />
    </div>
  );
}
