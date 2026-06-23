import {
  ASSETS,
  CENTRAL_TENSION,
  FACTS,
  NON_NEGOTIABLES,
  SELF_PATTERNS,
} from "@/lib/coaching-context";

export function DashboardCards() {
  return (
    <div className="space-y-6">
      {/* Central tension — the question the whole thing turns on */}
      <section className="rounded-2xl border border-clay-soft/40 bg-clay-wash/60 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-clay">
          The central tension
        </h2>
        <p className="mt-2 font-serif text-lg leading-relaxed text-ink">{CENTRAL_TENSION}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Facts" tone="neutral">
          <dl className="space-y-2.5 text-sm">
            {FACTS.map((f) => (
              <div key={f.label} className="grid grid-cols-[6.5rem_1fr] gap-3">
                <dt className="text-ink-muted">{f.label}</dt>
                <dd className="text-ink-soft">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="What 'good' looks like — non-negotiables" tone="neutral">
          <List items={NON_NEGOTIABLES} marker="•" />
        </Panel>

        <Panel title="The asset side — what you'd lose" tone="sage">
          <List items={ASSETS} marker="+" markerClass="text-sage" />
        </Panel>

        <Panel title="Your own patterns — counterweights" tone="neutral">
          <List items={SELF_PATTERNS} marker="—" markerClass="text-clay" />
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "neutral" | "sage";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-6 shadow-sm ${
        tone === "sage"
          ? "border-sage/30 bg-sage-wash/50"
          : "border-paper-edge bg-paper-card"
      }`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function List({
  items,
  marker,
  markerClass = "text-ink-muted",
}: {
  items: string[];
  marker: string;
  markerClass?: string;
}) {
  return (
    <ul className="space-y-2.5 text-sm text-ink-soft">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className={`select-none ${markerClass}`}>{marker}</span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
