"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  addMessage,
  clearMessages,
  subscribeIncidents,
  subscribeMessages,
} from "@/lib/firestore";
import type { ChatMessage, Incident } from "@/lib/types";
import { STARTER_PROMPTS } from "@/lib/coaching-context";

export function ChatInterface() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uid) return;
    const unsubMsgs = subscribeMessages(uid, setMessages);
    const unsubInc = subscribeIncidents(uid, setIncidents);
    return () => {
      unsubMsgs();
      unsubInc();
    };
  }, [uid]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !uid || busy) return;

    setInput("");
    setBusy(true);

    const userMsg: Omit<ChatMessage, "id"> = {
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    await addMessage(uid, userMsg);

    // Build the history we send to the model (persisted messages + this turn).
    const history = [...messages, { ...userMsg }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history, incidents }),
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
      acc += `\n\n[error] ${err instanceof Error ? err.message : "request failed"}`;
    }

    if (acc.trim()) {
      await addMessage(uid, {
        role: "assistant",
        content: acc.trim(),
        createdAt: Date.now(),
      });
    }
    setStreaming("");
    setBusy(false);
  }

  async function handleClear() {
    if (!uid) return;
    if (!confirm("Clear this whole conversation? Incidents are kept.")) return;
    await clearMessages(uid);
  }

  const empty = messages.length === 0 && !streaming;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto pb-4">
        {empty && (
          <div className="mx-auto max-w-xl pt-10 text-center">
            <p className="font-serif text-2xl text-ink">What&apos;s on your mind?</p>
            <p className="mt-2 text-ink-muted">
              A place to think out loud, pressure-test a reaction, or prep a hard conversation.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-xl border border-paper-edge bg-paper-card p-3 text-left text-sm text-ink-soft transition hover:border-clay-soft hover:text-ink"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}
        {streaming && <Bubble role="assistant" content={streaming} pending />}
      </div>

      <div className="border-t border-paper-edge pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
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
            className="max-h-40 flex-1 resize-none rounded-xl border border-paper-edge bg-paper-card px-4 py-3 text-ink outline-none focus:border-clay-soft"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-paper transition hover:bg-ink-soft disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
          <span>{busy ? "Thinking…" : "Enter to send · Shift+Enter for a new line"}</span>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 hover:text-clay"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear conversation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Bubble({
  role,
  content,
  pending,
}: {
  role: ChatMessage["role"];
  content: string;
  pending?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-relaxed ${
          isUser
            ? "bg-ink text-paper"
            : "border border-paper-edge bg-paper-card text-ink-soft"
        } ${pending ? "opacity-90" : ""}`}
      >
        {content}
        {pending && <span className="ml-0.5 inline-block animate-pulse">▍</span>}
      </div>
    </div>
  );
}
