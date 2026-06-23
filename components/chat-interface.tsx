"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Eraser } from "lucide-react";
import { addMessage, clearMessages, getMessages } from "@/lib/firestore";
import type { ChatMessage } from "@/lib/types";
import { STARTER_PROMPTS } from "@/lib/coaching-context";

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMessages()
      .then(setMessages)
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setInput("");
    setBusy(true);

    const userMsg: ChatMessage = { role: "user", content: trimmed, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    addMessage(userMsg).catch(() => {});

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
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
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: acc.trim(),
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      addMessage(assistantMsg).catch(() => {});
    }
    setStreaming("");
    setBusy(false);
  }

  async function handleClear() {
    if (!confirm("Clear this conversation? Your incident log is kept.")) return;
    await clearMessages().catch(() => {});
    setMessages([]);
  }

  const empty = messages.length === 0 && !streaming;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-7 overflow-y-auto pb-6">
        {empty && (
          <div className="mx-auto max-w-2xl pt-12 text-center animate-rise">
            <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">
              A coach, not a mirror
            </p>
            <p className="mt-3 font-serif text-3xl text-bone">What&apos;s on your mind?</p>
            <p className="mt-2 text-ash">
              Think out loud, pressure-test a reaction, or prep a hard conversation.
            </p>
            <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="group rounded-2xl border border-night-hair bg-night-raised p-4 text-left text-sm leading-relaxed text-ash transition hover:border-ember/40 hover:text-bone"
                >
                  <span className="mr-2 text-ember opacity-60 transition group-hover:opacity-100">
                    →
                  </span>
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
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember text-night transition hover:bg-ember-soft disabled:opacity-30"
            aria-label="Send"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </form>
        <div className="mt-2.5 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-eyebrow text-smoke">
          <span>{busy ? "thinking…" : "enter to send · shift+enter for a line"}</span>
          {messages.length > 0 && (
            <button onClick={handleClear} className="flex items-center gap-1 transition hover:text-ember">
              <Eraser className="h-3 w-3" /> clear
            </button>
          )}
        </div>
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
  // The coach speaks as correspondence: serif prose with an ember margin-rule.
  return (
    <div className="animate-rise border-l-2 border-ember/45 pl-5">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-ember/70">
        Coach
      </p>
      <div className="max-w-2xl whitespace-pre-wrap font-serif text-[17px] leading-relaxed text-bone/95">
        {content}
        {pending && (
          <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-ember animate-glowpulse" />
        )}
      </div>
    </div>
  );
}
