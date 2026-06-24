import { NextResponse } from "next/server";
import { clearCollection, deleteDocumentPath, setDocument } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  await setDocument(s.idToken, s.uid, `conversations/${params.id}`, {
    title: String(body.title ?? "Untitled").slice(0, 120),
    updatedAt: Date.now(),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await clearCollection(s.idToken, s.uid, `conversations/${params.id}/messages`);
  await deleteDocumentPath(s.idToken, s.uid, `conversations/${params.id}`);
  return NextResponse.json({ ok: true });
}
