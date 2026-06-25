"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  BookMarked,
  ChevronDown,
  Copy,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";
import {
  addMessage,
  createConversation,
  deleteConversation,
  generateTitle,
  getMemory,
  getMessages,
  listConversations,
  renameConversation,
} from "@/lib/firestore";
import type { ChatMessage, Conversation } from "@/lib/types";
import { STARTER_PROMPTS } from "@/lib/coaching-context";
import { useConfirm, useToast } from "./ui";

const PREPARE_SEED =
  "Walk me through preparing for a hard conversation with Dami. Ask me one question at a time, waiting for my answer between each: (1) what specifically happened — the behaviour, not my verdict; (2) the impact on me and what I actually need from him; (3) what I'm afraid will happen if I raise it. Then help me draft an opener that names the impact without making him wrong, and rehearse his likely response. Start with question 1.";

interface UiMessage extends ChatMessage {
  tools?: string[];
}

const TOOL_LABEL: Record<string, string> = {
  update_memory: "memory updated",
  log_incident: "logged to your record",
};

function stripTools(text: string): { clean: string; tools: string[] } {
  const tools: string[] = [];
  const clean = text.replace(/<<tool:(\w+)>>/g, (_, name) => {
    tools.push(name);
    return "";
  });
  return { clean, tools };
}

function relTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function ChatInterface() {
  const toast = useToast();
  const confirm = useConfirm();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<{ text: string; tools: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [memory, setMemory] = useState<string | null>(null);
  const [memOpen, setMemOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const booted = useRef(false);

  const loadMessages = useCallback(async (id: string) => {
    try {
      setMessages(await getMessages(id));
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      const convos = await listConversations().catch(() => [] as Conversation[]);
      setConversations(convos);

      const p = new URLSearchParams(window.location.search);
      const seed = p.get("seed");
      const title = p.get("title");
      const thread = p.get("thread");
      const fresh = p.get("fresh");
      if (seed || fresh || thread) window.history.replaceState({}, "", "/chat");

      if (seed) {
        const convo = await createConversation(title || seed.slice(0, 60)).catch(() => null);
        if (convo?.id) {
          setConversations((prev) => [convo, ...prev]);
          setActiveId(convo.id);
          setMessages([]);
          void sendIn(convo.id, seed, []);
        }
        return;
      }
      if (fresh) {
        await newConversation();
        return;
      }
      if (thread && convos.some((c) => c.id === thread)) {
        setActiveId(thread);
        loadMessages(thread);
        return;
      }
      if (convos[0]?.id) {
        setActiveId(convos[0].id);
        loadMessages(convos[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  function growTextarea() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 176)}px`;
  }

  async function selectConversation(id: string) {
    setActiveId(id);
    setMenuOpen(false);
    setStreaming(null);
    await loadMessages(id);
  }

  async function newConversation() {
    const convo = await createConversation().catch(() => null);
    if (!convo?.id) return;
    setConversations((prev) => [convo, ...prev]);
    setActiveId(convo.id);
    setMessages([]);
    setMenuOpen(false);
  }

  async function removeConversation(id: string) {
    const ok = await confirm({
      title: "Delete this thread?",
      body: "The conversation and its messages will be removed. Your incident log and context are untouched.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await deleteConversation(id).catch(() => {});
    const next = conversations.filter((c) => c.id !== id);
    setConversations(next);
    if (activeId === id) {
      setActiveId(next[0]?.id ?? null);
      if (next[0]?.id) loadMessages(next[0].id);
      else setMessages([]);
    }
    toast("Thread deleted");
  }

  async function openMemory() {
    setMemOpen(true);
    if (memory === null) setMemory(await getMemory().catch(() => ""));
  }

  // Stream a turn into a known conversation.
  async function sendIn(convId: string, text: string, priorHistory: UiMessage[]) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    setBusy(true);

    const userMsg: UiMessage = { role: "user", content: trimmed, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    addMessage(convId, userMsg).catch(() => {});

    const history = [...priorHistory, userMsg].map((m) => ({ role: m.role, content: m.content }));
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming({ text: "", tools: [] });

    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      if (!res.body) throw new Error("No response stream.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const { clean, tools } = stripTools(acc);
        setStreaming({ text: clean, tools });
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        acc += "\n\n_(connection interrupted)_";
      }
    }

    const { clean, tools } = stripTools(acc);
    if (clean.trim()) {
      const assistantMsg: UiMessage = {
        role: "assistant",
        content: clean.trim(),
        createdAt: Date.now(),
        tools,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      addMessage(convId, { role: "assistant", content: clean.trim(), createdAt: assistantMsg.createdAt }).catch(() => {});
    }
    setStreaming(null);
    setBusy(false);
    abortRef.current = null;
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    let id = activeId;
    let prior = messages;
    let isNew = false;
    if (!id) {
      const convo = await createConversation(text.slice(0, 60)).catch(() => null);
      if (!convo?.id) return;
      setConversations((prev) => [convo, ...prev]);
      setActiveId(convo.id);
      id = convo.id;
      prior = [];
      isNew = true;
    }
    await sendIn(id, text, prior);
    if (isNew && id) void autoTitle(id, text);
  }

  async function autoTitle(id: string, firstText: string) {
    const title = await generateTitle(firstText);
    if (!title) return;
    await renameConversation(id, title).catch(() => {});
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }

  async function regenerate() {
    if (busy || !activeId) return;
    // Drop the trailing assistant turn from view and re-ask from the last user message.
    const lastUserIdx = [...messages].map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx < 0) return;
    const upto = messages.slice(0, lastUserIdx + 1);
    setMessages(upto);
    setBusy(true);
    setStreaming({ text: "", tools: [] });
    const history = upto.map((m) => ({ role: m.role, content: m.content }));
    const controller = new AbortController();
    abortRef.current = controller;
    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const { clean, tools } = stripTools(acc);
        setStreaming({ text: clean, tools });
      }
    } catch {
      /* ignore */
    }
    const { clean, tools } = stripTools(acc);
    if (clean.trim() && activeId) {
      const msg: UiMessage = { role: "assistant", content: clean.trim(), createdAt: Date.now(), tools };
      setMessages((prev) => [...prev, msg]);
      addMessage(activeId, { role: "assistant", content: clean.trim(), createdAt: msg.createdAt }).catch(() => {});
    }
    setStreaming(null);
    setBusy(false);
    abortRef.current = null;
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast("Copied"),
      () => toast("Couldn't copy", "error"),
    );
  }

  const activeTitle = conversations.find((c) => c.id === activeId)?.title ?? "New conversation";
  const empty = messages.length === 0 && !streaming;
  const lastIsAssistant = messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col">
      <div className="relative mb-3 flex items-center gap-2">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex max-w-[50%] items-center gap-2 rounded-xl border border-night-hair bg-night-raised px-3 py-2 text-sm text-bone transition hover:border-ember/40"
        >
          <span className="truncate">{activeTitle}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-smoke transition ${menuOpen ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={newConversation}
          className="flex items-center gap-1.5 rounded-xl border border-night-hair px-3 py-2 text-sm text-ash transition hover:border-ember/40 hover:text-bone"
        >
          <Plus className="h-4 w-4" strokeWidth={2} /> <span className="hidden sm:inline">New</span>
        </button>
        <button
          onClick={openMemory}
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-night-hair px-3 py-2 text-sm text-ash transition hover:border-dusk/50 hover:text-bone"
          title="What the coach remembers"
        >
          <BookMarked className="h-4 w-4" strokeWidth={1.8} /> <span className="hidden sm:inline">Memory</span>
        </button>

        {menuOpen && (
          <div className="absolute left-0 top-12 z-30 w-80 max-w-[90vw] rounded-2xl border border-night-hair bg-night-raised p-2 shadow-lamp lit-edge">
            {conversations.length === 0 && <p className="px-3 py-2 text-sm text-smoke">No threads yet.</p>}
            <ul className="max-h-80 overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.id} className="group flex items-center gap-2 rounded-lg px-1">
                  <button
                    onClick={() => c.id && selectConversation(c.id)}
                    className={`flex-1 truncate rounded-lg px-2.5 py-2 text-left text-sm transition ${
                      c.id === activeId ? "text-ember" : "text-ash hover:text-bone"
                    }`}
                  >
                    {c.title}
                    <span className="ml-2 font-mono text-[10px] text-smoke">{relTime(c.updatedAt)}</span>
                  </button>
                  <button
                    onClick={() => c.id && removeConversation(c.id)}
                    className="text-smoke opacity-0 transition hover:text-[#E59A8C] group-hover:opacity-100"
                    aria-label="Delete thread"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-7 overflow-y-auto pb-6">
        {empty && (
          <div className="mx-auto max-w-2xl pt-8 text-center">
            <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">A coach, not a mirror</p>
            <p className="mt-3 font-display text-3xl text-bone">What&apos;s on your mind?</p>
            <p className="mt-2 text-ash">Think out loud, pressure-test a reaction, or prep a hard conversation.</p>
            <button
              onClick={() => send(PREPARE_SEED)}
              className="group mt-7 flex w-full items-center justify-between gap-3 rounded-2xl border border-ember/30 bg-night-raised p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-ember/60 hover:shadow-glow"
            >
              <span>
                <span className="flex items-center gap-2 font-serif text-lg text-bone">
                  <Sparkles className="h-4 w-4 text-ember" /> Prepare for a hard conversation
                </span>
                <span className="mt-0.5 block text-sm text-ash">
                  A guided walk-through — the impact, what you need, his likely response, an opener.
                </span>
              </span>
              <span className="text-2xl text-ember opacity-70 transition group-hover:opacity-100">→</span>
            </button>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="group rounded-2xl border border-night-hair bg-night-raised p-4 text-left text-sm leading-relaxed text-ash transition duration-300 hover:-translate-y-0.5 hover:border-ember/40 hover:text-bone hover:shadow-glow"
                >
                  <span className="mr-2 text-ember opacity-60 transition group-hover:opacity-100">→</span>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <Turn
            key={m.id ?? i}
            msg={m}
            onCopy={() => copy(m.content)}
            onRetry={i === messages.length - 1 && lastIsAssistant && !busy ? regenerate : undefined}
          />
        ))}
        {streaming && <Turn msg={{ role: "assistant", content: streaming.text, createdAt: 0, tools: streaming.tools }} pending />}
      </div>

      <div className="border-t border-night-hair pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-night-hair bg-night-raised p-2 transition focus-within:border-ember/50"
        >
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              growTextarea();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Type what happened, or what you're weighing…"
            className="max-h-44 flex-1 resize-none bg-transparent px-3 py-2.5 text-bone placeholder:text-smoke/70 outline-none"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-night-hair text-ash transition hover:text-bone"
              aria-label="Stop"
            >
              <Square className="h-4 w-4" fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember text-night transition hover:bg-ember-soft disabled:opacity-30"
              aria-label="Send"
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2.2} />
            </button>
          )}
        </form>
        <p className="mt-2.5 px-1 font-mono text-[10px] uppercase tracking-eyebrow text-smoke">
          {busy ? "thinking…" : "enter to send · ⌘K to jump · the coach remembers across threads"}
        </p>
      </div>

      {memOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button aria-label="Close" onClick={() => setMemOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="relative h-full w-full max-w-md animate-rise overflow-y-auto border-l border-night-hair bg-night-raised p-6 shadow-lamp">
            <p className="font-mono text-[11px] uppercase tracking-eyebrow text-dusk">The coach remembers</p>
            <h2 className="mt-1 font-serif text-2xl text-bone">Memory</h2>
            <p className="mt-1 text-sm text-ash">
              Carried into every thread. The coach maintains this itself — edit it in Settings.
            </p>
            <div className="mt-5 whitespace-pre-wrap rounded-xl border border-night-hair bg-night-input p-4 font-mono text-sm leading-relaxed text-ash">
              {memory === null ? "loading…" : memory.trim() || "Nothing remembered yet — it fills in as you talk."}
            </div>
            <button
              onClick={() => setMemOpen(false)}
              className="mt-5 font-mono text-[11px] uppercase tracking-eyebrow text-smoke transition hover:text-ash"
            >
              Close
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

function Turn({
  msg,
  pending,
  onCopy,
  onRetry,
}: {
  msg: UiMessage;
  pending?: boolean;
  onCopy?: () => void;
  onRetry?: () => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-night-hair bg-night-input px-4 py-2.5 leading-relaxed text-bone">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="group border-l-2 border-ember/45 pl-5">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-ember shadow-[0_0_8px_rgba(224,162,74,0.8)]" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ember/70">Coach</span>
        {!pending && (onCopy || onRetry) && (
          <span className="ml-1 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
            {onCopy && (
              <button onClick={onCopy} className="text-smoke transition hover:text-bone" aria-label="Copy">
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
            {onRetry && (
              <button onClick={onRetry} className="text-smoke transition hover:text-bone" aria-label="Retry">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        )}
      </div>
      <div className="coach-letter coach-prose max-w-2xl font-serif text-[17px] leading-relaxed text-bone/95">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || "​"}</ReactMarkdown>
        {pending && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-ember animate-glowpulse" />}
      </div>
      {msg.tools && msg.tools.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {msg.tools.map((t, i) => (
            <span
              key={i}
              className="rounded-full border border-dusk/30 bg-dusk/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow text-dusk-soft"
            >
              {TOOL_LABEL[t] ?? t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
