import { NextResponse } from "next/server";
import {
  addToCollection,
  clearCollection,
  listCollection,
} from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const docs = await listCollection(s.idToken, s.uid, "messages");
  docs.sort((a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0));
  return NextResponse.json({ messages: docs });
}

export async function POST(req: Request) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    role?: string;
    content?: string;
  };
  const role = body.role === "assistant" ? "assistant" : "user";
  const content = typeof body.content === "string" ? body.content : "";
  if (!content.trim()) {
    return NextResponse.json({ error: "Empty message." }, { status: 400 });
  }
  await addToCollection(s.idToken, s.uid, "messages", {
    role,
    content,
    createdAt: Date.now(),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await clearCollection(s.idToken, s.uid, "messages");
  return NextResponse.json({ ok: true });
}
