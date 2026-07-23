// Normalizes pasted text or an uploaded file (plain text or JSON export) into
// a flat list of { speaker, text } messages. No dependency on a specific
// export format — this best-effort-detects common shapes and falls back to
// treating unattributed lines as continuations of the previous message.
import type { ParsedMessage } from "./types";

const MAX_MESSAGES = 800;

export interface ParseResult {
  messages: ParsedMessage[];
  truncated: boolean;
  sourceLabel: string;
}

export function parseChatInput(raw: string, filename?: string): ParseResult {
  const trimmed = raw.trim();
  const sourceLabel = filename?.trim() || "Pasted text";
  if (!trimmed) return { messages: [], truncated: false, sourceLabel };

  const messages = tryParseJson(trimmed) ?? parsePlainText(trimmed);
  const truncated = messages.length > MAX_MESSAGES;
  return { messages: truncated ? messages.slice(-MAX_MESSAGES) : messages, truncated, sourceLabel };
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
