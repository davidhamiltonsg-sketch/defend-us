import { NextResponse } from "next/server";
import { listCollection } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";
import { EMPTY_ANALYSIS_RESULT, type AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const docs = await listCollection(s.idToken, s.uid, "analyses");
  docs.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

  const analyses = docs.map((d) => {
    const messageCount = Number(d.messageCount) || 0;
    return {
      id: d.id,
      title: d.title,
      createdAt: Number(d.createdAt) || 0,
      sourceLabel: d.sourceLabel,
      messageCount,
      // Older saved analyses predate sampling metadata — assume unsampled.
      analyzedMessageCount: typeof d.analyzedMessageCount === "number" ? d.analyzedMessageCount : messageCount,
      sampled: typeof d.sampled === "boolean" ? d.sampled : false,
      result: parseResult(d.resultJson),
    };
  });

  return NextResponse.json({ analyses });
}

// Defensively merges over EMPTY_ANALYSIS_RESULT so older saved analyses
// (from before a schema field was added) still render without crashing.
function parseResult(json: unknown): AnalysisResult {
  if (typeof json === "string") {
    try {
      return { ...EMPTY_ANALYSIS_RESULT, ...(JSON.parse(json) as Partial<AnalysisResult>) };
    } catch {
      /* fall through */
    }
  }
  return EMPTY_ANALYSIS_RESULT;
}
