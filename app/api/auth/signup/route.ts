import { NextResponse } from "next/server";
import { ALLOWED_EMAIL } from "@/lib/config";
import { AuthError, friendlyAuthError, signUpWithPassword } from "@/lib/server/firebase-rest";
import { setSession } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}) as Record<string, string>);
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  // Only the allow-listed email may create the account.
  if (ALLOWED_EMAIL && String(email).trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "This account isn't allowed here." }, { status: 403 });
  }
  try {
    const r = await signUpWithPassword(String(email).trim(), String(password));
    setSession({
      idToken: r.idToken,
      refreshToken: r.refreshToken,
      exp: Date.now() + r.expiresIn * 1000,
      uid: r.uid,
      email: r.email,
    });
    return NextResponse.json({ email: r.email });
  } catch (e) {
    const msg = e instanceof AuthError ? friendlyAuthError(e.message) : "Couldn't create the account.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
