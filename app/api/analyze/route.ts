import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { parseChatInput, sampleToBudget } from "@/lib/chat-parse";
import { HEALTHY_PATTERNS, PATTERNS } from "@/lib/manipulation-patterns";
import { friendlyAnthropicError } from "@/lib/server/anthropic-error";
import { addToCollection } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";
import {
  EMPTY_ANALYSIS_RESULT,
  type AnalysisConfidence,
  type AnalysisResult,
  type FindingFrequency,
  type FindingSeverity,
  type ParsedMessage,
  type RiskLevel,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
// Vercel hard-caps Serverless Function request bodies at 4.5MB — platform-
// enforced, not configurable from app code (see FUNCTION_PAYLOAD_TOO_LARGE
// in Vercel's docs). Above that, the platform itself returns a raw 413
// before this route ever runs, so raising this any higher wouldn't help —
// it'd just trade our friendly error for an unhandled one. Staying well
// under 4.5MB leaves room for JSON-escaping overhead (quotes/newlines in
// the transcript inflate the wire size of the POST body by 10-20%).
const MAX_RAW_CHARS = 3_200_000;
// Vercel Hobby hard-kills this route at maxDuration (60s) regardless of what
// our own code does — a bigger transcript means more input to process AND
// (via more findings to report) more output to generate, so this has to stay
// comfortably inside that budget, not just "as much as fits in context."
const MAX_TRANSCRIPT_CHARS = 90_000;
const MAX_FINDINGS = 20;
const MAX_HEALTHY_FINDINGS = 15;
const REQUEST_TIMEOUT_MS = 50_000;
const PATTERN_IDS = new Set(PATTERNS.map((p) => p.id));
const HEALTHY_PATTERN_IDS = new Set(HEALTHY_PATTERNS.map((p) => p.id));

const QUOTE_SCHEMA = {
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
};

const TOOL: Anthropic.Tool = {
  name: "report_findings",
  description: "Report the full communication-pattern analysis of the transcript.",
  input_schema: {
    type: "object",
    properties: {
      riskLevel: {
        type: "string",
        enum: ["low", "moderate", "elevated", "severe"],
        description: "Overall assessment across the whole transcript, driven by the severity, frequency, and one-sidedness of concerning findings.",
      },
      confidence: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "How much the transcript (length, clarity, amount of context) supports this assessment.",
      },
      overallSummary: {
        type: "string",
        description: "'Communication Pattern Analysis' — 2-4 neutral sentences on the overall dynamic. No diagnosis, no verdict on the relationship.",
      },
      positiveObservations: {
        type: "string",
        description: "2-4 sentences on what's working — constructive behavior from either/both speakers. Required even if brief; do not skip this section.",
      },
      areasOfConcern: {
        type: "string",
        description: "2-4 sentences summarizing the concerning patterns found, referencing which speaker(s) and how the cycle tends to play out.",
      },
      tensionPatterns: {
        type: "string",
        description: "2-3 sentences on when/how tension escalates and de-escalates across the transcript (timing, triggers, what shuts a conversation down or reopens it).",
      },
      recommendations: {
        type: "array",
        items: { type: "string" },
        description: "3-5 concrete, actionable next steps. Generic and non-prescriptive about the relationship's future (e.g. communication guidelines, naming a pattern out loud, professional counseling if patterns are severe/frequent).",
      },
      speakers: { type: "array", items: { type: "string" } },
      tensionTimeline: {
        type: "array",
        maxItems: 8,
        description: "Split the transcript into up to 8 chronological segments (by date if timestamps exist, else by even message-count chunks). One concern-level point per segment.",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "Short label for this segment — a date, date range, or 'messages 1-40'." },
            concernLevel: { type: "integer", description: "0-100. How much concerning-pattern activity this segment contains relative to the rest of the transcript." },
          },
          required: ["label", "concernLevel"],
        },
      },
      findings: {
        type: "array",
        maxItems: MAX_FINDINGS,
        description: `Concerning-pattern instances, most significant first (cap at ${MAX_FINDINGS} — group repeats of the same pattern from the same speaker into one entry with a higher frequency rather than listing near-duplicates). Apply the identical evidentiary bar to every speaker — do not favor whichever speaker uploaded this transcript.`,
        items: {
          type: "object",
          properties: {
            patternId: { type: "string", enum: Array.from(PATTERN_IDS) },
            title: { type: "string", description: "A short, specific description of this instance, e.g. 'Dismissing feelings with \"you're overreacting\"'." },
            severity: {
              type: "string",
              enum: ["serious", "moderate", "minor"],
              description: "How severe THIS instance reads in context — independent of the pattern's general tier. A mild-looking instance that recurs often (see frequency + cumulativeImpact) can still warrant a higher severity than a one-off outlier.",
            },
            frequency: { type: "string", enum: ["frequent", "occasional", "rare"] },
            attribution: { type: "string", description: "The speaker name who exhibited this, or 'Both' if it's mutual." },
            explanation: { type: "string", description: "Concrete: what was said, why it reads as this pattern rather than something more benign." },
            quotes: QUOTE_SCHEMA,
            healthyAlternative: { type: "string", description: "A short, concrete rewrite or approach specific to this excerpt — not generic advice." },
            cumulativeImpact: {
              type: "string",
              description: "What repeated exposure to this pattern does to the person on the receiving end over time, if it recurs across the transcript — not just this one instance. If this is a genuine one-off with no established pattern, say that plainly rather than inventing a trend.",
            },
          },
          required: ["patternId", "title", "severity", "frequency", "attribution", "explanation", "quotes", "healthyAlternative", "cumulativeImpact"],
        },
      },
      healthyFindings: {
        type: "array",
        maxItems: MAX_HEALTHY_FINDINGS,
        description: `Healthy/protective-pattern instances, from either or both speakers, most notable first (cap at ${MAX_HEALTHY_FINDINGS}). Report these with the same rigor as concerning findings — this analysis must not only list red flags.`,
        items: {
          type: "object",
          properties: {
            patternId: { type: "string", enum: Array.from(HEALTHY_PATTERN_IDS) },
            title: { type: "string", description: "A short, specific description of this instance." },
            frequency: { type: "string", enum: ["frequent", "occasional", "rare"] },
            attribution: { type: "string", description: "The speaker name who exhibited this, or 'Both'." },
            explanation: { type: "string" },
            quotes: QUOTE_SCHEMA,
          },
          required: ["patternId", "title", "frequency", "attribution", "explanation", "quotes"],
        },
      },
    },
    required: [
      "riskLevel",
      "confidence",
      "overallSummary",
      "positiveObservations",
      "areasOfConcern",
      "tensionPatterns",
      "recommendations",
      "speakers",
      "tensionTimeline",
      "findings",
      "healthyFindings",
    ],
  },
};

function catalogBlock(): string {
  const concerning = PATTERNS.map((p) => `- ${p.id} — ${p.name} (${p.severity}): ${p.summary} [${p.citation}]`).join("\n");
  const healthy = HEALTHY_PATTERNS.map((p) => `- ${p.id} — ${p.name}: ${p.summary} [${p.citation}]`).join("\n");
  return `CONCERNING PATTERNS (use these exact ids):\n${concerning}\n\nHEALTHY / PROTECTIVE PATTERNS (use these exact ids):\n${healthy}`;
}

const SYSTEM = `You are a careful, trauma-informed analyst reading a chat transcript for communication patterns, for someone trying to understand a relationship or conversation more clearly. Your findings are grounded in named, published psychology and communication research — not intuition.

${catalogBlock()}

Grounding — never guess or invent: every claim you make must trace to an exact, quotable passage in the transcript and to a named pattern in the catalogue above. Do not infer tone of voice, private intent, or off-text context (a phone call, an in-person conversation) that the transcript doesn't show — if a text exchange references something that evidently happened off-text, say plainly that it isn't visible in the transcript rather than filling the gap with a guess. "No evidence found in this transcript" is a different, more honest claim than "this didn't happen," and you should say the former, never imply the latter. If you are not confident a claim is directly supported by the text, leave it out.

Neutrality — this is the most important rule:
- Treat every speaker in the transcript symmetrically. Apply the exact same bar for evidence to each of them.
- Do not assume whoever uploaded this transcript is the wronged party, and do not assume the opposite either. You do not know who uploaded it.
- Actively look for concerning patterns AND healthy patterns from every speaker, not just one. If only one speaker's behavior is reported, that must be because the evidence genuinely only supports that — not because of an assumption about who is "the problem." When you find a concerning pattern from one speaker, explicitly check the transcript for a comparable — even if lesser or different-shaped — behavior from the other speaker before concluding it's one-sided.
- Do not flatter anyone. Do not soften a finding because it might be about the person reading the report.

Evidence rules:
- Only report a pattern where the transcript gives clear textual evidence. Quote it verbatim, attributed to the correct speaker.
- Do not report a pattern from a single ambiguous remark taken out of context — look for the pattern, not an isolated word choice.
- Do not diagnose anyone with a clinical or personality label, and do not predict the relationship's future. Describe behavior, not identity.
- Never invent content that isn't in the transcript.
- If nothing rises to the level of a pattern in a category, return an empty array for it and say so plainly in the relevant summary field — a clean result is a real result.

Ongoing impact — judge patterns across the timeline, not just moment-to-moment: a single sharp incident and a mild-looking exchange that quietly repeats every few weeks are different problems, and a per-instance read that ignores repetition will understate the second one. When scoring severity and writing cumulativeImpact, weigh how a pattern lands on someone who has now been through it multiple times, not just how the single quoted exchange reads in isolation. Conversely, don't manufacture a trend where the transcript only shows one instance — say plainly when something reads as an isolated event.

Did the repair actually hold? An apology or reconciliation is a separate fact from whether the underlying issue stayed resolved. When the transcript later shows the same complaint recurring after an apparent resolution, say so explicitly in cumulativeImpact rather than crediting the earlier repair as if it closed the matter — and apply this check to whichever speaker's pattern it is, not to just one side. Likewise, when checking escalation triggers, don't assume a consistent cause (e.g. "always triggered by dismissiveness") — look at what specifically preceded each instance; triggers are often more varied than a single-story explanation, and a real pattern should hold up instance by instance, not just in the aggregate telling.

Coverage: the transcript you're given may be a sample rather than every message — see the note at the top of the user message. When it is, that sample is evenly spaced across the FULL conversation, from its very start to its very end, so every era is represented. Reflect that honestly: lower your confidence rating when working from a sample, and if the sampling could plausibly be hiding or diluting a pattern (e.g. a lot of concerning activity clustered in a gap between sampled messages), say so in overallSummary.

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

  if ((body.raw ?? "").length > MAX_RAW_CHARS) {
    return NextResponse.json(
      { error: `That upload is too large (over ${(MAX_RAW_CHARS / 1_000_000).toFixed(0)}MB of text). Try the plain-text (.txt) export instead of an enriched JSON one — it's the same conversation in a much smaller file.` },
      { status: 400 },
    );
  }
  const raw = body.raw ?? "";
  if (!raw.trim()) return NextResponse.json({ error: "Nothing to analyze." }, { status: 400 });

  const parsed = parseChatInput(raw, body.filename);
  if (parsed.messages.length === 0) {
    return NextResponse.json({ error: "Couldn't find any messages in that upload." }, { status: 400 });
  }

  const budget = sampleToBudget(parsed.messages, MAX_TRANSCRIPT_CHARS);

  const { idToken, uid } = session;
  const client = new Anthropic({ apiKey });

  let result: AnalysisResult;
  try {
    const res = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 6000,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "report_findings" },
        messages: [
          {
            role: "user",
            content: `Transcript:\n${coverageNote(budget)}\n\n${buildTranscript(budget.messages)}`,
          },
        ],
      },
      // Fail on our own terms well inside Vercel's hard 60s cutoff, so a slow
      // request gets a clear error instead of a raw platform 504. Retries are
      // OFF: the SDK retries timeouts by default (maxRetries: 2), which meant
      // up to 3 attempts x this timeout — several times Vercel's own ceiling,
      // so the platform was killing the function mid-retry before our catch
      // block ever ran. One attempt, bounded, is what actually fits.
      { timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 },
    );
    const toolUse = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (!toolUse) throw new Error("The model did not return a structured analysis.");
    result = normalizeResult(toolUse.input as Record<string, unknown>);
  } catch (e) {
    return NextResponse.json({ error: friendlyAnthropicError(e) }, { status: 502 });
  }

  const title = body.title?.trim() || defaultTitle(parsed.messages);
  const record = {
    title,
    createdAt: Date.now(),
    sourceLabel: parsed.sourceLabel,
    messageCount: budget.totalCount,
    analyzedMessageCount: budget.messages.length,
    sampled: budget.sampled,
    resultJson: JSON.stringify(result),
  };
  const saved = await addToCollection(idToken, uid, "analyses", record);

  return NextResponse.json({
    analysis: {
      title,
      createdAt: record.createdAt,
      sourceLabel: record.sourceLabel,
      messageCount: record.messageCount,
      analyzedMessageCount: record.analyzedMessageCount,
      sampled: record.sampled,
      id: saved.id,
      result,
    },
  });
}

function coverageNote(budget: { sampled: boolean; messages: ParsedMessage[]; totalCount: number }): string {
  if (!budget.sampled) return `(all ${budget.totalCount} messages)`;
  const first = budget.messages[0]?.timestamp;
  const last = budget.messages[budget.messages.length - 1]?.timestamp;
  const span = first && last ? ` from ${first} to ${last}` : "";
  return `(too long to send in full — this is an evenly-spaced sample of ${budget.messages.length} of ${budget.totalCount} total messages, spanning the full conversation${span})`;
}

function buildTranscript(messages: ParsedMessage[]): string {
  return messages.map((m) => `${m.timestamp ? `[${m.timestamp}] ` : ""}${m.speaker}: ${m.text.replace(/\n/g, " ")}`).join("\n");
}

function defaultTitle(messages: ParsedMessage[]): string {
  const speakers = Array.from(new Set(messages.map((m) => m.speaker))).filter((s) => s !== "Unknown").slice(0, 2);
  const stamp = new Date().toLocaleDateString();
  return speakers.length ? `${speakers.join(" & ")} — ${stamp}` : `Analysis — ${stamp}`;
}

const RISK_LEVELS: RiskLevel[] = ["low", "moderate", "elevated", "severe"];
const CONFIDENCES: AnalysisConfidence[] = ["low", "medium", "high"];
const SEVERITIES: FindingSeverity[] = ["serious", "moderate", "minor"];
const FREQUENCIES: FindingFrequency[] = ["frequent", "occasional", "rare"];

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function oneOf<T extends string>(v: unknown, options: T[], fallback: T): T {
  return options.includes(v as T) ? (v as T) : fallback;
}

function normalizeQuotes(v: unknown): { speaker: string; text: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((q): q is Record<string, unknown> => !!q && typeof q === "object")
    .map((q) => ({ speaker: str(q.speaker, "Unknown") || "Unknown", text: str(q.text) }))
    .filter((q) => q.text.trim())
    .slice(0, 4);
}

function normalizeResult(input: Record<string, unknown>): AnalysisResult {
  const findingsRaw = Array.isArray(input.findings) ? input.findings : [];
  const findings = findingsRaw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .filter((f) => typeof f.patternId === "string" && PATTERN_IDS.has(f.patternId))
    .map((f) => ({
      patternId: String(f.patternId),
      title: str(f.title) || str(f.explanation).slice(0, 80),
      severity: oneOf(f.severity, SEVERITIES, "moderate"),
      frequency: oneOf(f.frequency, FREQUENCIES, "occasional"),
      attribution: str(f.attribution, "Unknown") || "Unknown",
      explanation: str(f.explanation),
      quotes: normalizeQuotes(f.quotes),
      healthyAlternative: str(f.healthyAlternative),
      cumulativeImpact: str(f.cumulativeImpact),
    }))
    .slice(0, MAX_FINDINGS);

  const healthyRaw = Array.isArray(input.healthyFindings) ? input.healthyFindings : [];
  const healthyFindings = healthyRaw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .filter((f) => typeof f.patternId === "string" && HEALTHY_PATTERN_IDS.has(f.patternId))
    .map((f) => ({
      patternId: String(f.patternId),
      title: str(f.title) || str(f.explanation).slice(0, 80),
      frequency: oneOf(f.frequency, FREQUENCIES, "occasional"),
      attribution: str(f.attribution, "Unknown") || "Unknown",
      explanation: str(f.explanation),
      quotes: normalizeQuotes(f.quotes),
    }))
    .slice(0, MAX_HEALTHY_FINDINGS);

  const timelineRaw = Array.isArray(input.tensionTimeline) ? input.tensionTimeline : [];
  const tensionTimeline = timelineRaw
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => ({
      label: str(t.label, "—") || "—",
      concernLevel: Math.max(0, Math.min(100, Math.round(Number(t.concernLevel)) || 0)),
    }))
    .slice(0, 8);

  const recommendations = Array.isArray(input.recommendations)
    ? input.recommendations.filter((r): r is string => typeof r === "string" && r.trim().length > 0)
    : [];

  return {
    ...EMPTY_ANALYSIS_RESULT,
    riskLevel: oneOf(input.riskLevel, RISK_LEVELS, "low"),
    confidence: oneOf(input.confidence, CONFIDENCES, "medium"),
    overallSummary: str(input.overallSummary),
    positiveObservations: str(input.positiveObservations),
    areasOfConcern: str(input.areasOfConcern),
    tensionPatterns: str(input.tensionPatterns),
    recommendations,
    speakers: Array.isArray(input.speakers) ? input.speakers.filter((s): s is string => typeof s === "string") : [],
    tensionTimeline,
    findings,
    healthyFindings,
  };
}
