"use client";

import { useState, type ReactNode } from "react";
import { MailCheck, ShieldHalf } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, configured, allowed, emailAllowed, verified, user } = useAuth();

  if (!configured) {
    return (
      <Centered>
        <Card>
          <h1 className="font-serif text-2xl text-ink">Almost there</h1>
          <p className="mt-3 text-ink-soft">
            Firebase isn&apos;t configured yet. Copy{" "}
            <code className="rounded bg-paper px-1.5 py-0.5 text-sm">.env.local.example</code>{" "}
            to <code className="rounded bg-paper px-1.5 py-0.5 text-sm">.env.local</code> and fill
            in your Firebase keys, then restart the dev server.
          </p>
        </Card>
      </Centered>
    );
  }

  if (loading) {
    return (
      <Centered>
        <p className="text-ink-muted">Loading…</p>
      </Centered>
    );
  }

  if (!user) {
    return (
      <Centered>
        <SignInForm />
      </Centered>
    );
  }

  if (!emailAllowed) {
    return (
      <Centered>
        <Card>
          <h1 className="font-serif text-2xl text-ink">Not this account</h1>
          <p className="mt-3 text-ink-soft">
            You&apos;re signed in as{" "}
            <span className="font-medium text-ink">{user.email}</span>, which isn&apos;t the
            account this space is for.
          </p>
          <SignOutLink />
        </Card>
      </Centered>
    );
  }

  if (!verified) {
    return (
      <Centered>
        <VerifyNotice email={user.email ?? ""} />
      </Centered>
    );
  }

  if (allowed) return <>{children}</>;

  return null;
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
      setError(friendlyAuthError(err));
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

function VerifyNotice({ email }: { email: string }) {
  const { resendVerification, refreshUser, signOut } = useAuth();
  const [status, setStatus] = useState("");

  return (
    <Card>
      <div className="flex items-center gap-3 text-clay">
        <MailCheck className="h-7 w-7" />
        <span className="font-serif text-2xl tracking-tight text-ink">Verify your email</span>
      </div>
      <p className="mt-4 text-ink-soft">
        We sent a verification link to{" "}
        <span className="font-medium text-ink">{email}</span>. Click it, then come back and
        continue. Verification is required before the app can read or write your data.
      </p>
      {status && <p className="mt-3 text-sm text-sage">{status}</p>}
      <div className="mt-6 space-y-2">
        <button
          onClick={() => refreshUser()}
          className="w-full rounded-lg bg-ink px-4 py-3 font-medium text-paper transition hover:bg-ink-soft"
        >
          I&apos;ve verified — continue
        </button>
        <button
          onClick={async () => {
            await resendVerification();
            setStatus("Verification email re-sent.");
          }}
          className="w-full rounded-lg border border-paper-edge px-4 py-2.5 text-ink-soft transition hover:border-clay-soft hover:text-ink"
        >
          Resend the email
        </button>
      </div>
      <button
        onClick={() => signOut()}
        className="mt-4 text-sm text-ink-muted transition hover:text-clay"
      >
        Sign out
      </button>
    </Card>
  );
}

function SignOutLink() {
  const { signOut } = useAuth();
  return (
    <button
      onClick={() => signOut().catch(() => {})}
      className="mt-5 text-sm text-ink-muted transition hover:text-clay"
    >
      Sign out
    </button>
  );
}

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/email-already-in-use":
      return "That email already has an account — try signing in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    default:
      return err instanceof Error ? err.message : "Something went wrong. Try again.";
  }
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
