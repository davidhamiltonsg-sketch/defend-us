import { NextResponse } from "next/server";
import { addToCollection, listCollection } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";
import { EMPTY_INCIDENT } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const docs = await listCollection(s.idToken, s.uid, "incidents");
  docs.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  return NextResponse.json({ incidents: docs });
}

export async function POST(req: Request) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // Only persist the known incident fields.
  const incident: Record<string, unknown> = { createdAt: Date.now() };
  for (const key of Object.keys(EMPTY_INCIDENT)) {
    incident[key] = typeof body[key] === "string" ? body[key] : "";
  }
  await addToCollection(s.idToken, s.uid, "incidents", incident);
  return NextResponse.json({ ok: true });
}
