"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { ALLOWED_EMAIL, auth, firebaseConfigured } from "./firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
  /** Signed in AND on the allow-list (email matches). */
  emailAllowed: boolean;
  /** Cleared to use the app. */
  allowed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function emailMatches(email: string | null | undefined): boolean {
  return Boolean(
    email && (!ALLOWED_EMAIL || email.toLowerCase() === ALLOWED_EMAIL.toLowerCase()),
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthState>(() => {
    const emailAllowed = emailMatches(user?.email);
    return {
      user,
      loading,
      configured: firebaseConfigured,
      emailAllowed,
      allowed: emailAllowed,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      signUp: async (email, password) => {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      },
      signOut: async () => {
        await fbSignOut(auth);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
