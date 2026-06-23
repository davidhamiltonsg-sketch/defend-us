import { IncidentForm } from "@/components/incident-form";
import { IncidentList } from "@/components/incident-list";

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">Incident log</h1>
          <p className="mt-1 text-ink-muted">
            The specifics, in sequence. Theory without incident produces horoscopes.
          </p>
        </div>
        <IncidentForm />
      </header>
      <IncidentList />
    </div>
  );
}
