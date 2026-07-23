import { NextResponse } from "next/server";
import { ALLOWED_EMAIL } from "@/lib/config";
import { sendPasswordResetEmail } from "@/lib/server/firebase-rest";

export const runtime = "nodejs";

// Always responds the same way regardless of whether the email matches the
// allow-listed account, so this can't be used to probe who has an account.
export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const trimmed = String(email ?? "").trim();

  if (trimmed && (!ALLOWED_EMAIL || trimmed.toLowerCase() === ALLOWED_EMAIL.toLowerCase())) {
    await sendPasswordResetEmail(trimmed).catch(() => {
      /* swallow — same generic response either way */
    });
  }

  return NextResponse.json({ ok: true });
}
