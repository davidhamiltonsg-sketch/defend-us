// Normalizes pasted text or an uploaded file (plain text or JSON export) into
// a flat list of { speaker, text } messages. No dependency on a specific
// export format — this best-effort-detects common shapes and falls back to
// treating unattributed lines as continuations of the previous message.
//
// This parses the FULL input — no truncation here. Fitting a large parsed
// transcript into a model call's character budget is a separate step
// (sampleToBudget below), because doing both in one pass tends to produce
// silent, confusing double-truncation (see git history on this file).
import type { ParsedMessage } from "./types";

export interface ParseResult {
  messages: ParsedMessage[];
  sourceLabel: string;
}

export function parseChatInput(raw: string, filename?: string): ParseResult {
  const trimmed = raw.trim();
  const sourceLabel = filename?.trim() || "Pasted text";
  if (!trimmed) return { messages: [], sourceLabel };

  const messages = tryParseJson(trimmed) ?? parsePlainText(trimmed);
  return { messages, sourceLabel };
}

function messageLineLength(m: ParsedMessage): number {
  // Mirrors the "speaker: text" line format used when building the prompt.
  return m.speaker.length + 2 + m.text.length + 1;
}

export interface BudgetResult {
  messages: ParsedMessage[];
  sampled: boolean;
  totalCount: number;
}

// Fits `messages` inside `maxChars` by systematic sampling — keeping every
// Nth message, spread evenly across the FULL chronological range — rather
// than cutting from one end. A long-running chat's early and late history
// both stay represented instead of one being silently dropped.
export function sampleToBudget(messages: ParsedMessage[], maxChars: number): BudgetResult {
  const totalCount = messages.length;
  const totalChars = messages.reduce((sum, m) => sum + messageLineLength(m), 0);
  if (totalChars <= maxChars || totalCount === 0) {
    return { messages, sampled: false, totalCount };
  }

  const stride = totalChars / maxChars;
  const sampled: ParsedMessage[] = [];
  let nextTake = 0;
  for (let i = 0; i < messages.length; i++) {
    if (i >= nextTake) {
      sampled.push(messages[i]);
      nextTake += stride;
    }
  }

  // Index-based stride approximates the char-budget reduction; trim any
  // remaining overshoot (e.g. from unusually long messages) as a final guard.
  let used = 0;
  const trimmed: ParsedMessage[] = [];
  for (const m of sampled) {
    const len = messageLineLength(m);
    if (used + len > maxChars && trimmed.length > 0) break;
    trimmed.push(m);
    used += len;
  }

  return { messages: trimmed, sampled: true, totalCount };
}

function tryParseJson(raw: string): ParsedMessage[] | null {
  if (!(raw.startsWith("[") || raw.startsWith("{"))) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  const arr = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.messages)
      ? data.messages
      : null;
  if (!arr) return null;

  const out: ParsedMessage[] = [];
  for (const item of arr) {
    if (typeof item === "string") {
      if (item.trim()) out.push({ speaker: "Unknown", text: item.trim() });
      continue;
    }
    if (!isRecord(item)) continue;
    const speaker = pickString(item, ["speaker", "sender", "author", "from", "role", "name"]) ?? "Unknown";
    const text = pickString(item, ["text", "message", "body", "content", "msg"]);
    const timestamp = pickString(item, ["timestamp", "date", "time", "createdAt"]);
    if (text?.trim()) out.push({ speaker, text: text.trim(), timestamp });
  }
  return out.length ? out : null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(o: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

// WhatsApp-style: "[3/14/25, 9:41:02 PM] David: message" or "3/14/25, 9:41 PM - David: message"
const EXPORT_LINE_RE =
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s?(?:[APap][Mm])?)\]?\s*[-–—]?\s*([^:]{1,40}):\s(.*)$/;
// Generic "Name: message" lines.
const NAME_COLON_RE = /^([A-Za-z0-9 _.'’-]{1,32}):\s(.*)$/;

function parsePlainText(raw: string): ParsedMessage[] {
  const lines = raw.split(/\r?\n/);
  const messages: ParsedMessage[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const exp = EXPORT_LINE_RE.exec(line);
    if (exp) {
      messages.push({ timestamp: exp[1], speaker: exp[2].trim(), text: exp[3].trim() });
      continue;
    }

    const nc = NAME_COLON_RE.exec(line);
    if (nc) {
      messages.push({ speaker: nc[1].trim(), text: nc[2].trim() });
      continue;
    }

    if (messages.length > 0) {
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        text: `${messages[messages.length - 1].text}\n${line.trim()}`,
      };
    } else {
      messages.push({ speaker: "Unknown", text: line.trim() });
    }
  }

  return messages;
}
