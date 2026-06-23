"use client";

import { useState, type ReactNode } from "react";
import { ShieldHalf } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, email } = useAuth();

  if (loading) {
    return (
      <Centered>
        <p className="text-ink-muted">Loading…</p>
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
    <Card>
      <div className="flex items-center gap-3 text-clay">
        <ShieldHalf className="h-7 w-7" />
        <span className="font-serif text-3xl tracking-tight text-ink">defend-us</span>
      </div>
      <p className="mt-4 text-ink-soft">
        A private space to think clearly about your relationship — between the moments.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-paper-edge bg-paper px-3 py-2.5 text-ink outline-none focus:border-clay-soft"
        />
        <input
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-paper-edge bg-paper px-3 py-2.5 text-ink outline-none focus:border-clay-soft"
        />
        {error && <p className="text-sm text-clay">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-ink px-4 py-3 font-medium text-paper transition hover:bg-ink-soft disabled:opacity-50"
        >
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError("");
        }}
        className="mt-4 text-sm text-ink-muted transition hover:text-clay"
      >
        {mode === "signin"
          ? "First time? Create your account"
          : "Already have an account? Sign in"}
      </button>
    </Card>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">{children}</div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-paper-edge bg-paper-card p-8 shadow-sm">
      {children}
    </div>
  );
}
