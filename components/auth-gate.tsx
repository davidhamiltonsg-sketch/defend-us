"use client";

import { useState, type ReactNode } from "react";
import { ShieldHalf } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, email } = useAuth();

  if (loading) {
    return (
      <Centered>
        <p className="font-mono text-xs uppercase tracking-eyebrow text-smoke animate-glowpulse">
          opening the room…
        </p>
      </Centered>
    );
  }

  if (!email) {
    return (
      <Centered>
        <SignInForm />
      </Centered>
    );
  }

  return <>{children}</>;
}

function SignInForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email, password);
      else await signUp(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative w-full max-w-md animate-rise">
      {/* the lamp — a glow that slowly breathes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-24 h-48 rounded-full bg-ember/25 blur-[80px] animate-breathe"
      />
      <div className="relative rounded-3xl border border-night-hair bg-night-raised/90 p-9 shadow-lamp backdrop-blur-sm">
        <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">
          Private · between the moments
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ember/40">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-ember/20 blur-md animate-breathe"
            />
            <ShieldHalf className="relative h-5 w-5 text-ember" strokeWidth={1.7} />
          </span>
          <span className="font-serif text-[40px] leading-none tracking-tight text-bone">
            defend-us
          </span>
        </div>
        <p className="mt-4 border-l border-ember/40 pl-4 font-serif text-[17px] italic leading-relaxed text-ash">
          A coach, not a mirror. Somewhere to think out loud, pressure-test a reaction, and stay
          honest — before the next hard conversation.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          <Field
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            placeholder="you@email.com"
            label="Email"
          />
          <Field
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            label="Password"
            minLength={6}
          />
          {error && <p className="text-sm text-[#E59A8C]">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 w-full rounded-xl bg-ember px-4 py-3 font-medium text-night shadow-glow transition hover:bg-ember-soft disabled:opacity-50"
          >
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
          className="mt-5 font-mono text-[11px] uppercase tracking-eyebrow text-smoke transition hover:text-ember"
        >
          {mode === "signin" ? "First time → create your account" : "← Back to sign in"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-eyebrow text-smoke">
        {label}
      </span>
      <input
        type={type}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-night-hair bg-night-input px-4 py-3 text-bone placeholder:text-smoke/60 outline-none transition focus:border-ember/60 focus:ring-4 focus:ring-ember/10"
      />
    </label>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center px-5">{children}</div>;
}
