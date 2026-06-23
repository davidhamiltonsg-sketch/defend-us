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
      // leave the current list in place on a transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">Incident log</h1>
          <p className="mt-1 text-ink-muted">
            The specifics, in sequence. Theory without incident produces horoscopes.
          </p>
        </div>
        <IncidentForm onSaved={refresh} />
      </header>
      <IncidentList incidents={incidents} loading={loading} onChanged={refresh} />
    </div>
  );
}
