import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getValidSession();
  return NextResponse.json({ email: s?.email ?? null });
}
