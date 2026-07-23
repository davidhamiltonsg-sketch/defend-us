"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Auth runs entirely through our own server (same origin), so the browser never
// needs to reach googleapis.com directly. The server holds the Firebase tokens
// in an HTTP-only cookie.

interface AuthState {
  email: string | null;
  loading: boolean;
  allowed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function postAuth(path: string, body: object): Promise<string> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Something went wrong. Try again.");
  return data.email as string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (active) setEmail(d.email ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    // Any API route returning 401 (expired session) drops us to sign-in.
    const onUnauthorized = () => setEmail(null);
    window.addEventListener("du:unauthorized", onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener("du:unauthorized", onUnauthorized);
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      email,
      loading,
      allowed: Boolean(email),
      signIn: async (e, p) => setEmail(await postAuth("/api/auth/login", { email: e, password: p })),
      signUp: async (e, p) => setEmail(await postAuth("/api/auth/signup", { email: e, password: p })),
      signOut: async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        setEmail(null);
      },
      forgotPassword: async (e) => {
        await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: e }),
        }).catch(() => {});
      },
    }),
    [email, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
