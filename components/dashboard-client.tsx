"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { getContext, saveContext } from "@/lib/firestore";
import { useToast } from "./ui";
import type { ContextData } from "@/lib/types";

export function DashboardClient() {
  const toast = useToast();
  const [context, setContext] = useState<ContextData | null>(null);
  const [draft, setDraft] = useState<ContextData | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getContext()
      .then(setContext)
      .catch(() => {});
  }, []);

  function startEdit() {
    if (!context) return;
    setDraft(structuredClone(context));
    setEditing(true);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      await saveContext(draft);
      setContext(draft);
      setEditing(false);
      toast("Context saved");
    } catch {
      toast("Couldn't save — try again", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!context) {
    return (
      <p className="font-mono text-xs uppercase tracking-eyebrow text-smoke animate-glowpulse">
        loading the frame…
      </p>
    );
  }

  const c = editing && draft ? draft : context;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">
            Standing context · yours to edit
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.2rem,5.5vw,3.4rem)] font-light leading-[1.03] tracking-tight text-bone">
            What the coach <em className="italic text-ember">holds</em>
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-eyebrow">
            <span className="flex items-center gap-1.5 text-smoke">
              <span className="h-1.5 w-1.5 rounded-full bg-ash" /> Facts
            </span>
            <span className="flex items-center gap-1.5 text-smoke">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" /> Your account
            </span>
            <span className="flex items-center gap-1.5 text-smoke">
              <span className="h-1.5 w-1.5 rounded-full bg-dusk" /> The lens
            </span>
          </div>
        </div>
        {!editing ? (
          <button
            onClick={startEdit}
            className="flex items-center gap-2 rounded-xl border border-night-hair px-4 py-2 text-sm text-ash transition hover:border-ember/40 hover:text-bone"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.8} /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-ember px-4 py-2 text-sm font-medium text-night shadow-glow transition hover:bg-ember-soft disabled:opacity-50"
            >
              <Check className="h-4 w-4" strokeWidth={2.2} /> {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl px-3 py-2 font-mono text-[11px] uppercase tracking-eyebrow text-smoke transition hover:text-ash"
            >
              Cancel
            </button>
          </div>
        )}
      </header>

      {/* central tension */}
      <section
        className="relative animate-rise overflow-hidden rounded-3xl border border-ember/25 bg-night-raised p-8 shadow-lamp sm:p-10"
        style={{ animationDelay: "60ms" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-ember/15 blur-[80px] animate-breathe"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-1 -top-8 select-none font-serif text-[10rem] leading-none text-ember/15"
        >
          &ldquo;
        </span>
        <p className="relative font-mono text-[11px] uppercase tracking-eyebrow text-ember">
          The question it turns on
        </p>
        {editing && draft ? (
          <textarea
            value={draft.centralTension}
            onChange={(e) => setDraft({ ...draft, centralTension: e.target.value })}
            rows={4}
            className="relative mt-4 w-full resize-y rounded-xl border border-night-hair bg-night-input p-4 font-serif text-xl leading-snug text-bone outline-none focus:border-ember/60"
          />
        ) : (
          <p className="relative mt-4 max-w-3xl font-serif text-[clamp(1.4rem,3vw,1.95rem)] font-light leading-snug text-bone">
            {c.centralTension}
          </p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel eyebrow="The facts" accent="ash" delay={120}>
          {editing && draft ? (
            <FactsEditor facts={draft.facts} onChange={(facts) => setDraft({ ...draft, facts })} />
          ) : (
            <dl className="space-y-3 text-sm">
              {c.facts.map((f, i) => (
                <div key={i} className="grid grid-cols-[7rem_1fr] gap-3">
                  <dt className="font-mono text-[11px] uppercase tracking-wide text-smoke">{f.label}</dt>
                  <dd className="text-ash">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Panel>

        <Panel eyebrow="What 'good' looks like" accent="ember" delay={180}>
          <ListView
            editing={editing}
            items={c.nonNegotiables}
            dotClass="bg-ember"
            onChange={(nonNegotiables) => draft && setDraft({ ...draft, nonNegotiables })}
          />
        </Panel>

        <Panel eyebrow="What you'd lose" accent="moss" delay={240}>
          <ListView
            editing={editing}
            items={c.assets}
            dotClass="bg-moss"
            onChange={(assets) => draft && setDraft({ ...draft, assets })}
          />
        </Panel>

        <Panel eyebrow="Your own patterns" accent="dusk" delay={300}>
          <ListView
            editing={editing}
            items={c.selfPatterns}
            dotClass="bg-dusk"
            onChange={(selfPatterns) => draft && setDraft({ ...draft, selfPatterns })}
          />
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
  delay,
  children,
}: {
  eyebrow: string;
  accent: keyof typeof ACCENT_BAR;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative animate-rise overflow-hidden rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`absolute inset-y-0 left-0 w-px ${ACCENT_BAR[accent]} opacity-50`} />
      <h2 className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">{eyebrow}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ListView({
  editing,
  items,
  dotClass,
  onChange,
}: {
  editing: boolean;
  items: string[];
  dotClass: string;
  onChange: (items: string[]) => void;
}) {
  if (!editing) {
    return (
      <ul className="space-y-3 text-sm text-ash">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <textarea
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            rows={2}
            className="flex-1 resize-y rounded-lg border border-night-hair bg-night-input px-3 py-2 text-sm text-bone outline-none focus:border-ember/60"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="mt-1 text-smoke transition hover:text-[#E59A8C]"
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, ""])} label="Add" />
    </div>
  );
}

function FactsEditor({
  facts,
  onChange,
}: {
  facts: { label: string; value: string }[];
  onChange: (facts: { label: string; value: string }[]) => void;
}) {
  return (
    <div className="space-y-2">
      {facts.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={f.label}
            onChange={(e) => {
              const next = [...facts];
              next[i] = { ...next[i], label: e.target.value };
              onChange(next);
            }}
            placeholder="Label"
            className="w-28 rounded-lg border border-night-hair bg-night-input px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide text-smoke outline-none focus:border-ember/60"
          />
          <input
            value={f.value}
            onChange={(e) => {
              const next = [...facts];
              next[i] = { ...next[i], value: e.target.value };
              onChange(next);
            }}
            placeholder="Value"
            className="flex-1 rounded-lg border border-night-hair bg-night-input px-3 py-1.5 text-sm text-ash outline-none focus:border-ember/60"
          />
          <button
            type="button"
            onClick={() => onChange(facts.filter((_, j) => j !== i))}
            className="text-smoke transition hover:text-[#E59A8C]"
            aria-label="Remove fact"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <AddButton onClick={() => onChange([...facts, { label: "", value: "" }])} label="Add fact" />
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-smoke transition hover:text-ember"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
