import {
  ASSETS,
  CENTRAL_TENSION,
  FACTS,
  NON_NEGOTIABLES,
  SELF_PATTERNS,
} from "@/lib/coaching-context";

export function DashboardCards() {
  return (
    <div className="space-y-5">
      {/* The single question the whole thing turns on — the hero. */}
      <section className="relative overflow-hidden rounded-3xl border border-ember/25 bg-night-raised p-7 shadow-lamp sm:p-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-ember/15 blur-3xl"
        />
        <p className="relative font-mono text-[11px] uppercase tracking-eyebrow text-ember">
          The question it turns on
        </p>
        <p className="relative mt-3 max-w-3xl font-serif text-2xl leading-snug text-bone sm:text-[28px]">
          {CENTRAL_TENSION}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel eyebrow="The facts" accent="ash">
          <dl className="space-y-3 text-sm">
            {FACTS.map((f) => (
              <div key={f.label} className="grid grid-cols-[7rem_1fr] gap-3">
                <dt className="font-mono text-[11px] uppercase tracking-wide text-smoke">
                  {f.label}
                </dt>
                <dd className="text-ash">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel eyebrow="What 'good' looks like" accent="ember">
          <List items={NON_NEGOTIABLES} dotClass="bg-ember" />
        </Panel>

        <Panel eyebrow="What you'd lose" accent="moss">
          <List items={ASSETS} dotClass="bg-moss" />
        </Panel>

        <Panel eyebrow="Your own patterns" accent="dusk">
          <List items={SELF_PATTERNS} dotClass="bg-dusk" />
        </Panel>
      </div>
    </div>
  );
}

const ACCENT_BAR: Record<string, string> = {
  ember: "bg-ember",
  moss: "bg-moss",
  dusk: "bg-dusk",
  ash: "bg-smoke",
};

function Panel({
  eyebrow,
  accent,
  children,
}: {
  eyebrow: string;
  accent: keyof typeof ACCENT_BAR;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp">
      <span className={`absolute inset-y-0 left-0 w-px ${ACCENT_BAR[accent]} opacity-50`} />
      <h2 className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">{eyebrow}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items, dotClass }: { items: string[]; dotClass: string }) {
  return (
    <ul className="space-y-3 text-sm text-ash">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
