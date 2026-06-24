import { NextResponse } from "next/server";
import { deleteFromCollection, setDocument } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";
import { EMPTY_INCIDENT } from "@/lib/types";

export const runtime = "nodejs";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const fields: Record<string, unknown> = {};
  for (const key of Object.keys(EMPTY_INCIDENT)) {
    fields[key] = typeof body[key] === "string" ? body[key] : "";
  }
  await setDocument(s.idToken, s.uid, `incidents/${params.id}`, fields);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await deleteFromCollection(s.idToken, s.uid, "incidents", params.id);
  return NextResponse.json({ ok: true });
}
