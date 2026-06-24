import { NextResponse } from "next/server";
import { AuthError, changePassword, friendlyAuthError } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const password = String(body.password ?? "");
  if (password.length < 6) {
    return NextResponse.json({ error: "Password should be at least 6 characters." }, { status: 400 });
  }
  try {
    await changePassword(s.idToken, password);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof AuthError ? friendlyAuthError(e.message) : "Couldn't change password.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
