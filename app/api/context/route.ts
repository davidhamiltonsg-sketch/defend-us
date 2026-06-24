import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/server/session";
import { loadContext, saveContext } from "@/lib/server/store";
import type { ContextData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const context = await loadContext(s.idToken, s.uid);
  return NextResponse.json({ context });
}

export async function PUT(req: Request) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as ContextData | null;
  if (!body || typeof body.centralTension !== "string" || !Array.isArray(body.facts)) {
    return NextResponse.json({ error: "Invalid context." }, { status: 400 });
  }
  // Normalise to the known shape.
  const clean: ContextData = {
    centralTension: String(body.centralTension),
    facts: body.facts
      .filter((f) => f && (f.label || f.value))
      .map((f) => ({ label: String(f.label ?? ""), value: String(f.value ?? "") })),
    nonNegotiables: (body.nonNegotiables ?? []).map(String).filter((x) => x.trim()),
    assets: (body.assets ?? []).map(String).filter((x) => x.trim()),
    selfPatterns: (body.selfPatterns ?? []).map(String).filter((x) => x.trim()),
  };
  await saveContext(s.idToken, s.uid, clean);
  return NextResponse.json({ ok: true });
}
