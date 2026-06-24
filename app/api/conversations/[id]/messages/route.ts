import { NextResponse } from "next/server";
import { addToCollection, listCollection, setDocument } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const msgs = await listCollection(s.idToken, s.uid, `conversations/${params.id}/messages`);
  msgs.sort((a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0));
  return NextResponse.json({ messages: msgs });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { role?: string; content?: string };
  const role = body.role === "assistant" ? "assistant" : "user";
  const content = typeof body.content === "string" ? body.content : "";
  if (!content.trim()) return NextResponse.json({ error: "Empty message." }, { status: 400 });

  await addToCollection(s.idToken, s.uid, `conversations/${params.id}/messages`, {
    role,
    content,
    createdAt: Date.now(),
  });
  // Keep the conversation sorted to the top of the list.
  await setDocument(s.idToken, s.uid, `conversations/${params.id}`, { updatedAt: Date.now() });
  return NextResponse.json({ ok: true });
}
