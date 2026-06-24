import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/coaching-context";
import { addToCollection, listCollection } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";
import { loadContext, loadMemory, saveMemory } from "@/lib/server/store";
import { EMPTY_INCIDENT, type ChatMessage, type Incident } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

const TOOLS: Anthropic.Tool[] = [
  {
    name: "update_memory",
    description:
      "Persist the running memory for continuity across conversations. Pass the FULL revised memory (it replaces the old one). Use when a decision, recurring pattern, commitment, or useful reframe emerges that should carry forward. Keep it concise; prune stale notes.",
    input_schema: {
      type: "object",
      properties: { memory: { type: "string", description: "The full revised memory, in Markdown." } },
      required: ["memory"],
    },
  },
  {
    name: "log_incident",
    description:
      "Record a discrete incident in David's structured log. Use only when David describes a specific event and would benefit from logging it — offer first unless he's clearly asked. Behaviour only in 'trigger'; no interpretation there.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string" },
        trigger: { type: "string", description: "What happened, behaviour only, in sequence." },
        davidDidSaid: { type: "string" },
        damiDidSaid: { type: "string" },
        davidWanted: { type: "string" },
        resolution: { type: "string" },
        davidRead: { type: "string" },
        openQuestion: { type: "string" },
      },
      required: ["trigger"],
    },
  },
];

export async function POST(req: Request) {
  const session = await getValidSession();
  if (!session) {
    return json({ error: "Not signed in." }, 401);
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: "ANTHROPIC_API_KEY is not set on the server." }, 500);
  }

  let body: { messages?: Pick<ChatMessage, "role" | "content">[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const initial = (body.messages ?? [])
    .filter((m) => m.content?.trim())
    .map((m) => ({ role: m.role, content: m.content }));
  if (initial.length === 0) return json({ error: "No messages provided." }, 400);

  const { idToken, uid } = session;
  const [context, memory, rawIncidents] = await Promise.all([
    loadContext(idToken, uid),
    loadMemory(idToken, uid),
    listCollection(idToken, uid, "incidents"),
  ]);
  const system = buildSystemPrompt(context, memory, rawIncidents as unknown as Incident[]);
  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const messages: Anthropic.MessageParam[] = initial.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let iter = 0; iter < 5; iter++) {
          const s = client.messages.stream({
            model: MODEL,
            max_tokens: 4096,
            thinking: { type: "adaptive" },
            system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
            tools: TOOLS,
            messages,
          });
          s.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
          const final = await s.finalMessage();
          messages.push({ role: "assistant", content: final.content });

          if (final.stop_reason !== "tool_use") break;

          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type !== "tool_use") continue;
            const out = await runTool(idToken, uid, block.name, block.input);
            results.push({ type: "tool_result", tool_use_id: block.id, content: out });
          }
          messages.push({ role: "user", content: results });
        }
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[error] ${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

async function runTool(
  idToken: string,
  uid: string,
  name: string,
  input: unknown,
): Promise<string> {
  const data = (input ?? {}) as Record<string, unknown>;
  try {
    if (name === "update_memory") {
      await saveMemory(idToken, uid, String(data.memory ?? ""));
      return "Memory updated.";
    }
    if (name === "log_incident") {
      const fields: Record<string, unknown> = { createdAt: Date.now() };
      for (const key of Object.keys(EMPTY_INCIDENT)) {
        fields[key] = typeof data[key] === "string" ? data[key] : "";
      }
      await addToCollection(idToken, uid, "incidents", fields);
      return "Logged the incident to David's log.";
    }
    return `Unknown tool: ${name}`;
  } catch (e) {
    return `Tool failed: ${e instanceof Error ? e.message : "error"}`;
  }
}

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
