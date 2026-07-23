"use client";

import { useRef, useState } from "react";
import { ClipboardPaste, ScanSearch, Upload } from "lucide-react";
import { analyzeChat } from "@/lib/firestore";
import type { Analysis } from "@/lib/types";

export function AnalysisUpload({ onDone }: { onDone: (analysis: Analysis) => void }) {
  const [raw, setRaw] = useState("");
  const [filename, setFilename] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function pickFile(file: File) {
    setError("");
    try {
      const text = await file.text();
      setRaw(text);
      setFilename(file.name);
    } catch {
      setError("Couldn't read that file.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!raw.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const analysis = await analyzeChat(raw, filename, title.trim() || undefined);
      onDone(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="animate-rise rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp">
      <p className="font-mono text-[11px] uppercase tracking-eyebrow text-ember">New analysis</p>
      <h2 className="mt-1 font-serif text-2xl text-bone">Read a conversation</h2>
      <p className="mt-1 max-w-xl text-sm text-ash">
        Paste a transcript, or upload a text export or JSON chat log. Names are read as they appear —
        WhatsApp-style exports, plain <code className="rounded bg-night-input px-1 py-0.5 font-mono text-xs">Name: message</code> lines,
        and JSON arrays of messages are all understood.
      </p>

      <div className="mt-5">
        <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-smoke">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Argument about the trip"
          className="mt-1.5 w-full rounded-lg border border-night-hair bg-night-input px-3 py-2 text-bone placeholder:text-smoke/60 outline-none transition focus:border-ember/60"
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label className="font-mono text-[10px] uppercase tracking-eyebrow text-smoke">Transcript</label>
          <div className="flex items-center gap-3">
            {filename && <span className="text-xs text-smoke">{filename}</span>}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-night-hair px-2.5 py-1 text-xs text-ash transition hover:border-ember/40 hover:text-bone"
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={1.8} /> Upload file
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".txt,.json,text/plain,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <textarea
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setFilename(undefined);
          }}
          placeholder={"Paste the conversation here…\n\ne.g.\nDavid: can we talk about last night\nDami: I already said sorry"}
          rows={10}
          className="mt-1.5 w-full resize-y rounded-lg border border-night-hair bg-night-input px-3 py-2 font-mono text-sm text-bone placeholder:text-smoke/60 outline-none transition focus:border-ember/60"
        />
        {!filename && raw.length > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-smoke">
            <ClipboardPaste className="h-3 w-3" /> {raw.length.toLocaleString()} characters pasted
          </p>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-[#E59A8C]">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || !raw.trim()}
          className="flex items-center gap-2 rounded-xl bg-ember px-4 py-2.5 font-medium text-night shadow-glow transition hover:bg-ember-soft disabled:opacity-50"
        >
          <ScanSearch className="h-4 w-4" strokeWidth={2.2} />
          {busy ? "Reading…" : "Analyze"}
        </button>
        {busy && (
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke animate-glowpulse">
            checking against 13 patterns…
          </span>
        )}
      </div>
    </form>
  );
}
