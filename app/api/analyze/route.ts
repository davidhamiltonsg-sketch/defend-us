import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { parseChatInput } from "@/lib/chat-parse";
import { PATTERNS } from "@/lib/manipulation-patterns";
import { addToCollection } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";
import type { AnalysisConfidence, AnalysisResult, ParsedMessage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const MAX_RAW_CHARS = 300_000;
const MAX_TRANSCRIPT_CHARS = 50_000;
const PATTERN_IDS = new Set(PATTERNS.map((p) => p.id));

const TOOL: Anthropic.Tool = {
  name: "report_findings",
  description: "Report the manipulation-pattern analysis of the transcript.",
  input_schema: {
    type: "object",
    properties: {
      overallSummary: {
        type: "string",
        description: "2-4 neutral sentences describing the conversation's dynamics. No diagnosis, no verdict on the relationship or the people in it.",
      },
      speakers: { type: "array", items: { type: "string" } },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            patternId: { type: "string", enum: Array.from(PATTERN_IDS) },
            speaker: { type: "string", description: "The speaker (by name as it appears in the transcript) who exhibited this pattern." },
            instanceCount: { type: "integer", description: "How many separate times this pattern shows up in the transcript." },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            explanation: {
              type: "string",
              description: "Concrete: what was said, and why it reads as this pattern rather than something more benign.",
            },
            quotes: {
              type: "array",
              maxItems: 4,
              items: {
                type: "object",
                properties: {
                  speaker: { type: "string" },
                  text: { type: "string", description: "A verbatim excerpt from the transcript." },
                },
                required: ["speaker", "text"],
              },
            },
            healthyAlternative: {
              type: "string",
              description: "A short, concrete rewrite or approach that would have avoided the pattern — specific to this excerpt, not generic advice.",
            },
          },
          required: ["patternId", "speaker", "instanceCount", "confidence", "explanation", "quotes", "healthyAlternative"],
        },
      },
    },
    required: ["overallSummary", "speakers", "findings"],
  },
};

function catalogBlock(): string {
  return PATTERNS.map((p) => `- ${p.id} — ${p.name} (${p.severity}): ${p.summary}`).join("\n");
}

const SYSTEM = `You are a careful, trauma-informed analyst reading a chat transcript for manipulation and communication patterns, for someone trying to understand their own relationship or conversation more clearly.

Reference catalogue — use these exact pattern ids, do not invent new ones:
${catalogBlock()}

Rules:
- Only report a pattern where the transcript gives clear textual evidence. Quote it.
- Every quote must be a verbatim excerpt from the transcript, attributed to the speaker who said it.
- Do not report a pattern from a single ambiguous remark taken out of context — look for the pattern, not an isolated word choice.
- Attribute each finding to the specific speaker who exhibited it.
- Do not diagnose anyone with a clinical or personality label, and do not predict the relationship's future. Describe behavior, not identity.
- Keep explanations concrete: what was said, why it reads as this pattern.
- healthyAlternative should be a short, concrete rewrite or approach — not generic advice.
- If nothing in the transcript rises to the level of a pattern, return an empty findings array and say so plainly in overallSummary.
- Never invent content that isn't in the transcript.

Call report_findings exactly once with your complete analysis.`;

export async function POST(req: Request) {
  const session = await getValidSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set on the server." }, { status: 500 });

  let body: { raw?: string; filename?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (body.raw ?? "").slice(0, MAX_RAW_CHARS);
  if (!raw.trim()) return NextResponse.json({ error: "Nothing to analyze." }, { status: 400 });

  const parsed = parseChatInput(raw, body.filename);
  if (parsed.messages.length === 0) {
    return NextResponse.json({ error: "Couldn't find any messages in that upload." }, { status: 400 });
  }

  const { idToken, uid } = session;
  const client = new Anthropic({ apiKey });

  let result: AnalysisResult;
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "report_findings" },
      messages: [
        {
          role: "user",
          content: `Transcript (${parsed.messages.length} messages${parsed.truncated ? ", truncated to the most recent portion" : ""}):\n\n${buildTranscript(parsed.messages)}`,
        },
      ],
    });
    const toolUse = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (!toolUse) throw new Error("The model did not return a structured analysis.");
    result = normalizeResult(toolUse.input as Record<string, unknown>);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Analysis failed." }, { status: 502 });
  }

  const title = body.title?.trim() || defaultTitle(parsed.messages);
  const record = {
    title,
    createdAt: Date.now(),
    sourceLabel: parsed.sourceLabel,
    messageCount: parsed.messages.length,
    resultJson: JSON.stringify(result),
  };
  const saved = await addToCollection(idToken, uid, "analyses", record);

  return NextResponse.json({ analysis: { title, createdAt: record.createdAt, sourceLabel: record.sourceLabel, messageCount: record.messageCount, id: saved.id, result } });
}

function buildTranscript(messages: ParsedMessage[]): string {
  const text = messages.map((m) => `${m.speaker}: ${m.text.replace(/\n/g, " ")}`).join("\n");
  return text.length > MAX_TRANSCRIPT_CHARS ? text.slice(-MAX_TRANSCRIPT_CHARS) : text;
}

function defaultTitle(messages: ParsedMessage[]): string {
  const speakers = Array.from(new Set(messages.map((m) => m.speaker))).filter((s) => s !== "Unknown").slice(0, 2);
  const stamp = new Date().toLocaleDateString();
  return speakers.length ? `${speakers.join(" & ")} — ${stamp}` : `Analysis — ${stamp}`;
}

function normalizeResult(input: Record<string, unknown>): AnalysisResult {
  const findingsRaw = Array.isArray(input.findings) ? input.findings : [];
  const CONFIDENCES: AnalysisConfidence[] = ["low", "medium", "high"];

  const findings = findingsRaw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .filter((f) => typeof f.patternId === "string" && PATTERN_IDS.has(f.patternId))
    .map((f) => ({
      patternId: String(f.patternId),
      speaker: typeof f.speaker === "string" && f.speaker.trim() ? f.speaker : "Unknown",
      instanceCount: Math.max(1, Number(f.instanceCount) || 1),
      confidence: CONFIDENCES.includes(f.confidence as AnalysisConfidence) ? (f.confidence as AnalysisConfidence) : "medium",
      explanation: typeof f.explanation === "string" ? f.explanation : "",
      quotes: Array.isArray(f.quotes)
        ? f.quotes
            .filter((q): q is Record<string, unknown> => !!q && typeof q === "object")
            .map((q) => ({
              speaker: typeof q.speaker === "string" && q.speaker.trim() ? q.speaker : "Unknown",
              text: typeof q.text === "string" ? q.text : "",
            }))
            .filter((q) => q.text.trim())
            .slice(0, 4)
        : [],
      healthyAlternative: typeof f.healthyAlternative === "string" ? f.healthyAlternative : "",
    }));

  return {
    overallSummary: typeof input.overallSummary === "string" ? input.overallSummary : "",
    speakers: Array.isArray(input.speakers) ? input.speakers.filter((s): s is string => typeof s === "string") : [],
    findings,
  };
}
