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
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { ALLOWED_EMAIL, auth, firebaseConfigured } from "./firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
  /** Signed in AND on the allow-list (email matches), regardless of verification. */
  emailAllowed: boolean;
  /** Email has been verified (required by the Firestore rules). */
  verified: boolean;
  /** Fully cleared to use the app: allow-listed email + verified. */
  allowed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
  // Bumped on refreshUser() to recompute verification after the user verifies.
  const [tick, setTick] = useState(0);

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
    const verified = Boolean(user?.emailVerified);
    return {
      user,
      loading,
      configured: firebaseConfigured,
      emailAllowed,
      verified,
      allowed: emailAllowed && verified,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      signUp: async (email, password) => {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(cred.user);
      },
      resendVerification: async () => {
        if (auth.currentUser) await sendEmailVerification(auth.currentUser);
      },
      refreshUser: async () => {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          setUser(auth.currentUser);
          setTick((t) => t + 1);
        }
      },
      signOut: async () => {
        await fbSignOut(auth);
      },
    };
    // tick is intentionally a dependency so consumers re-read verification after reload.
  }, [user, loading, tick]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
