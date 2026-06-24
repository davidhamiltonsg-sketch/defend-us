import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/server/session";
import { loadMemory, saveMemory } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ memory: await loadMemory(s.idToken, s.uid) });
}

export async function PUT(req: Request) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { memory?: string };
  await saveMemory(s.idToken, s.uid, String(body.memory ?? ""));
  return NextResponse.json({ ok: true });
}
