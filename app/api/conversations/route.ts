import { NextResponse } from "next/server";
import { addToCollection, listCollection } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const convos = await listCollection(s.idToken, s.uid, "conversations");
  convos.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
  return NextResponse.json({ conversations: convos });
}

export async function POST(req: Request) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const now = Date.now();
  const created = await addToCollection(s.idToken, s.uid, "conversations", {
    title: (body.title || "New conversation").slice(0, 120),
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ conversation: created });
}
