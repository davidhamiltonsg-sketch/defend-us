"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, ChevronDown, Plus, Square, Trash2 } from "lucide-react";
import {
  addMessage,
  createConversation,
  deleteConversation,
  getMessages,
  listConversations,
} from "@/lib/firestore";
import type { ChatMessage, Conversation } from "@/lib/types";
import { STARTER_PROMPTS } from "@/lib/coaching-context";

const PREPARE_SEED =
  "Walk me through preparing for a hard conversation with Dami. Ask me one question at a time, waiting for my answer between each: (1) what specifically happened — the behaviour, not my verdict; (2) the impact on me and what I actually need from him; (3) what I'm afraid will happen if I raise it. Then help me draft an opener that names the impact without making him wrong, and rehearse his likely response so I'm ready for it. Start with question 1.";

export function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bootstrapped = useRef(false);

  const loadMessages = useCallback(async (id: string) => {
    try {
      setMessages(await getMessages(id));
    } catch {
      setMessages([]);
    }
  }, []);

  // Bootstrap: load threads, honour a ?seed=…&title=… deep-link, else open the latest.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    (async () => {
      const convos = await listConversations().catch(() => [] as Conversation[]);
      setConversations(convos);

      const params = new URLSearchParams(window.location.search);
      const seed = params.get("seed");
      const title = params.get("title");
      if (seed) {
        window.history.replaceState({}, "", "/chat");
        const convo = await createConversation(title || seed.slice(0, 60)).catch(() => null);
        if (convo?.id) {
          setConversations((prev) => [convo, ...prev]);
          setActiveId(convo.id);
          setMessages([]);
          void sendIn(convo.id, seed, []);
        }
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

  async function selectConversation(id: string) {
    setActiveId(id);
    setMenuOpen(false);
    setStreaming("");
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
    if (!confirm("Delete this thread and its messages?")) return;
    await deleteConversation(id).catch(() => {});
    const next = conversations.filter((c) => c.id !== id);
    setConversations(next);
    if (activeId === id) {
      setActiveId(next[0]?.id ?? null);
      if (next[0]?.id) loadMessages(next[0].id);
      else setMessages([]);
    }
  }

  // Send within a known conversation id, using a known prior history.
  async function sendIn(convId: string, text: string, priorHistory: ChatMessage[]) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    setBusy(true);

    const userMsg: ChatMessage = { role: "user", content: trimmed, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    addMessage(convId, userMsg).catch(() => {});

    const history = [...priorHistory, userMsg].map((m) => ({ role: m.role, content: m.content }));
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
      if (!res.body) throw new Error("No response stream.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreaming(acc);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        acc += `\n\n_(connection interrupted)_`;
      }
    }

    if (acc.trim()) {
      const assistantMsg: ChatMessage = { role: "assistant", content: acc.trim(), createdAt: Date.now() };
      setMessages((prev) => [...prev, assistantMsg]);
      addMessage(convId, assistantMsg).catch(() => {});
    }
    setStreaming("");
    setBusy(false);
    abortRef.current = null;
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    let id = activeId;
    let prior = messages;
    if (!id) {
      const convo = await createConversation(text.slice(0, 60)).catch(() => null);
      if (!convo?.id) return;
      setConversations((prev) => [convo, ...prev]);
      setActiveId(convo.id);
      id = convo.id;
      prior = [];
    }
    await sendIn(id, text, prior);
  }

  function stop() {
    abortRef.current?.abort();
  }

  const activeTitle = conversations.find((c) => c.id === activeId)?.title ?? "New conversation";
  const empty = messages.length === 0 && !streaming;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      {/* thread bar */}
      <div className="relative mb-3 flex items-center gap-2">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex max-w-[60%] items-center gap-2 rounded-xl border border-night-hair bg-night-raised px-3 py-2 text-sm text-bone transition hover:border-ember/40"
        >
          <span className="truncate">{activeTitle}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-smoke transition ${menuOpen ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={newConversation}
          className="flex items-center gap-1.5 rounded-xl border border-night-hair px-3 py-2 text-sm text-ash transition hover:border-ember/40 hover:text-bone"
        >
          <Plus className="h-4 w-4" strokeWidth={2} /> New
        </button>

        {menuOpen && (
          <div className="absolute left-0 top-12 z-30 w-80 max-w-[90vw] rounded-2xl border border-night-hair bg-night-raised p-2 shadow-lamp">
            {conversations.length === 0 && (
              <p className="px-3 py-2 text-sm text-smoke">No threads yet.</p>
            )}
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
                  </button>
                  <button
                    onClick={() => c.id && removeConversation(c.id)}
                    className="opacity-0 transition group-hover:opacity-100 text-smoke hover:text-[#E59A8C]"
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
          <div className="mx-auto max-w-2xl pt-10 text-center animate-rise">
            <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">
              A coach, not a mirror
            </p>
            <p className="mt-3 font-serif text-3xl text-bone">What&apos;s on your mind?</p>
            <p className="mt-2 text-ash">
              Think out loud, pressure-test a reaction, or prep a hard conversation.
            </p>
            <button
              onClick={() => send(PREPARE_SEED)}
              className="group mt-7 flex w-full items-center justify-between gap-3 rounded-2xl border border-ember/30 bg-night-raised p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-ember/60 hover:shadow-glow"
            >
              <span>
                <span className="block font-serif text-lg text-bone">
                  Prepare for a hard conversation
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
          <Turn key={m.id ?? i} role={m.role} content={m.content} />
        ))}
        {streaming && <Turn role="assistant" content={streaming} pending />}
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
              onClick={stop}
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
          {busy ? "thinking…" : "enter to send · shift+enter for a line · the coach remembers across threads"}
        </p>
      </div>
    </div>
  );
}

function Turn({
  role,
  content,
  pending,
}: {
  role: ChatMessage["role"];
  content: string;
  pending?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end animate-rise">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-night-hair bg-night-input px-4 py-2.5 leading-relaxed text-bone">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="animate-rise border-l-2 border-ember/45 pl-5">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-ember/70">Coach</p>
      {pending ? (
        <div className="max-w-2xl whitespace-pre-wrap font-serif text-[17px] leading-relaxed text-bone/95">
          {content}
          <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-ember animate-glowpulse" />
        </div>
      ) : (
        <div className="coach-letter coach-prose max-w-2xl font-serif text-[17px] leading-relaxed text-bone/95">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
