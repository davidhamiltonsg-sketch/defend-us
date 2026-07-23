"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  NotebookPen,
  Plus,
  ScanSearch,
  Search,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { getIncidents, listConversations } from "@/lib/firestore";
import type { Conversation, Incident } from "@/lib/types";

interface Item {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

const PREPARE = encodeURIComponent(
  "Walk me through preparing for a hard conversation with Dami, one question at a time: what happened, the impact and what I need, what I'm afraid of — then draft an opener and rehearse his likely response. Start with question 1.",
);

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [threads, setThreads] = useState<Conversation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("du:open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("du:open-command", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 20);
    listConversations().then(setThreads).catch(() => {});
    getIncidents().then(setIncidents).catch(() => {});
  }, [open]);

  const go = useCallback(
    (href: string) => {
      router.push(href);
      close();
    },
    [router, close],
  );

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      { id: "ctx", label: "Standing context", icon: LayoutDashboard, run: () => go("/") },
      { id: "talk", label: "New conversation", icon: Plus, run: () => go("/chat?fresh=1") },
      { id: "prep", label: "Prepare for a hard conversation", icon: Sparkles, run: () => go(`/chat?seed=${PREPARE}&title=Prepare`) },
      { id: "log", label: "Incident log", icon: NotebookPen, run: () => go("/incidents") },
      { id: "chat", label: "Conversations", icon: MessageCircle, run: () => go("/chat") },
      { id: "lens", label: "Chat Lens — analyze a conversation", icon: ScanSearch, run: () => go("/analyze") },
      { id: "set", label: "Settings", icon: Settings, run: () => go("/settings") },
    ];
    const q = query.trim().toLowerCase();
    if (!q) return base;

    const threadItems: Item[] = threads
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((t) => ({
        id: `t-${t.id}`,
        label: t.title,
        hint: "thread",
        icon: MessageCircle,
        run: () => go(`/chat?thread=${t.id}`),
      }));
    const incidentItems: Item[] = incidents
      .filter((i) => Object.values(i).some((v) => typeof v === "string" && v.toLowerCase().includes(q)))
      .slice(0, 5)
      .map((i) => ({
        id: `i-${i.id}`,
        label: i.date || i.trigger?.slice(0, 50) || "incident",
        hint: "incident",
        icon: NotebookPen,
        run: () => go("/incidents"),
      }));
    const filteredBase = base.filter((b) => b.label.toLowerCase().includes(q));
    return [...filteredBase, ...threadItems, ...incidentItems];
  }, [query, threads, incidents, go]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center px-5 pt-[18vh]">
      <button aria-label="Dismiss" onClick={close} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg animate-rise overflow-hidden rounded-2xl border border-night-hair bg-night-raised shadow-lamp">
        <div className="flex items-center gap-2 border-b border-night-hair px-4">
          <Search className="h-4 w-4 text-smoke" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                items[active]?.run();
              }
            }}
            placeholder="Jump to, or search threads & log…"
            className="flex-1 bg-transparent py-3.5 text-bone placeholder:text-smoke/70 outline-none"
          />
          <kbd className="font-mono text-[10px] uppercase tracking-eyebrow text-smoke">esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-3 text-sm text-smoke">No matches.</li>}
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={item.run}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    i === active ? "bg-night-input text-bone" : "text-ash"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-smoke" strokeWidth={1.8} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && (
                    <span className="font-mono text-[10px] uppercase tracking-eyebrow text-smoke">
                      {item.hint}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
