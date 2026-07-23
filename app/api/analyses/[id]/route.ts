import { NextResponse } from "next/server";
import { deleteFromCollection } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await deleteFromCollection(s.idToken, s.uid, "analyses", params.id);
  return NextResponse.json({ ok: true });
}
