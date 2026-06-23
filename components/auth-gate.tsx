"use client";

import { type ReactNode } from "react";
import { ShieldHalf } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, configured, allowed, user, signIn } = useAuth();

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
        <Card>
          <div className="flex items-center gap-3 text-clay">
            <ShieldHalf className="h-7 w-7" />
            <span className="font-serif text-3xl tracking-tight text-ink">defend-us</span>
          </div>
          <p className="mt-4 text-ink-soft">
            A private space to think clearly about your relationship — between the moments.
          </p>
          <button
            onClick={() => signIn().catch(() => {})}
            className="mt-6 w-full rounded-lg bg-ink px-4 py-3 font-medium text-paper transition hover:bg-ink-soft"
          >
            Sign in with Google
          </button>
        </Card>
      </Centered>
    );
  }

  if (!allowed) {
    return (
      <Centered>
        <Card>
          <h1 className="font-serif text-2xl text-ink">Not this account</h1>
          <p className="mt-3 text-ink-soft">
            You&apos;re signed in as{" "}
            <span className="font-medium text-ink">{user.email}</span>, which isn&apos;t the
            account this space is for.
          </p>
        </Card>
      </Centered>
    );
  }

  return <>{children}</>;
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
