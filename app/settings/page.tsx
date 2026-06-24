"use client";

import { useEffect, useState } from "react";
import { Download, KeyRound, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { changePassword, getMemory, saveMemory, wipeAll } from "@/lib/firestore";

export default function SettingsPage() {
  const { email, signOut } = useAuth();

  return (
    <div className="space-y-7 animate-rise">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">Settings</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-bone">Your space</h1>
        <p className="mt-2 text-ash">
          Signed in as <span className="text-bone">{email}</span>. Everything here is yours alone.
        </p>
      </header>

      <MemorySection />
      <PasswordSection />
      <DataSection onWiped={() => signOut()} />
    </div>
  );
}

function Card({ title, subtitle, children, danger }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border bg-night-raised p-6 shadow-lamp ${
        danger ? "border-[#5a3530]" : "border-night-hair"
      }`}
    >
      <h2 className={`font-serif text-xl ${danger ? "text-[#E59A8C]" : "text-bone"}`}>{title}</h2>
      <p className="mt-1 text-sm text-ash">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MemorySection() {
  const [memory, setMemory] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getMemory()
      .then(setMemory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setStatus("");
    try {
      await saveMemory(memory);
      setStatus("Saved.");
    } catch {
      setStatus("Couldn't save.");
    }
  }

  return (
    <Card
      title="The coach's memory"
      subtitle="What the coach carries between conversations. It updates this itself — you can read and edit it here."
    >
      {loading ? (
        <p className="font-mono text-xs uppercase tracking-eyebrow text-smoke">loading…</p>
      ) : (
        <>
          <textarea
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            rows={8}
            placeholder="Nothing remembered yet — the coach will start filling this in as you talk."
            className="w-full resize-y rounded-xl border border-night-hair bg-night-input p-3 font-mono text-sm leading-relaxed text-ash outline-none focus:border-ember/60"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={save}
              className="flex items-center gap-2 rounded-xl bg-ember px-4 py-2 text-sm font-medium text-night shadow-glow transition hover:bg-ember-soft"
            >
              <Save className="h-4 w-4" /> Save memory
            </button>
            {status && <span className="text-sm text-sage">{status}</span>}
          </div>
        </>
      )}
    </Card>
  );
}

function PasswordSection() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    if (password.length < 6) return setStatus("Password should be at least 6 characters.");
    if (password !== confirm) return setStatus("Passwords don't match.");
    setBusy(true);
    try {
      await changePassword(password);
      setStatus("Password changed.");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Couldn't change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Change password" subtitle="Pick something only you would know.">
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          className="rounded-lg border border-night-hair bg-night-input px-3 py-2 text-bone outline-none focus:border-ember/60"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm"
          autoComplete="new-password"
          className="rounded-lg border border-night-hair bg-night-input px-3 py-2 text-bone outline-none focus:border-ember/60"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 rounded-xl border border-night-hair px-4 py-2 text-sm text-ash transition hover:border-ember/40 hover:text-bone disabled:opacity-50"
        >
          <KeyRound className="h-4 w-4" /> Update
        </button>
        {status && <span className="w-full text-sm text-ash">{status}</span>}
      </form>
    </Card>
  );
}

function DataSection({ onWiped }: { onWiped: () => void }) {
  const [wiping, setWiping] = useState(false);

  async function wipe() {
    if (!confirm("Permanently delete ALL your data — conversations, incidents, context, memory? This can't be undone.")) return;
    if (!confirm("Last check: this is irreversible. Delete everything?")) return;
    setWiping(true);
    try {
      await wipeAll();
      onWiped();
    } finally {
      setWiping(false);
    }
  }

  return (
    <Card title="Your data" subtitle="It lives in your own Firebase project. Take it or delete it, any time." danger>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/api/export"
          className="flex items-center gap-2 rounded-xl border border-night-hair px-4 py-2 text-sm text-ash transition hover:border-ember/40 hover:text-bone"
        >
          <Download className="h-4 w-4" /> Export everything (JSON)
        </a>
        <button
          onClick={wipe}
          disabled={wiping}
          className="flex items-center gap-2 rounded-xl border border-[#5a3530] px-4 py-2 text-sm text-[#E59A8C] transition hover:bg-[#2a1a18] disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" /> {wiping ? "Deleting…" : "Delete all my data"}
        </button>
      </div>
    </Card>
  );
}
