// HTTP-only session cookie holding the user's Firebase tokens. Read/refreshed
// server-side so the browser never needs to talk to Google directly.
import { cookies } from "next/headers";
import { refreshIdToken } from "./firebase-rest";

const COOKIE = "du_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface Session {
  idToken: string;
  refreshToken: string;
  exp: number; // epoch ms when the idToken expires
  uid: string;
  email: string;
}

function encode(s: Session): string {
  return Buffer.from(JSON.stringify(s)).toString("base64url");
}

function decode(value: string): Session | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString()) as Session;
  } catch {
    return null;
  }
}

export function setSession(s: Session): void {
  cookies().set(COOKIE, encode(s), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSession(): void {
  cookies().delete(COOKIE);
}

function readSession(): Session | null {
  const value = cookies().get(COOKIE)?.value;
  return value ? decode(value) : null;
}

// Returns a session with a fresh idToken, refreshing if it's close to expiry.
// Returns null if there's no session or the refresh fails.
export async function getValidSession(): Promise<Session | null> {
  const s = readSession();
  if (!s?.refreshToken) return null;

  if (Date.now() < s.exp - 60_000) return s;

  try {
    const r = await refreshIdToken(s.refreshToken);
    const updated: Session = {
      idToken: r.idToken,
      refreshToken: r.refreshToken || s.refreshToken,
      exp: Date.now() + r.expiresIn * 1000,
      uid: s.uid,
      email: s.email,
    };
    setSession(updated);
    return updated;
  } catch {
    clearSession();
    return null;
  }
}
