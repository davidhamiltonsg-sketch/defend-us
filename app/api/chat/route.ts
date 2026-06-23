import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/coaching-context";
import type { ChatMessage, Incident } from "@/lib/types";

export const runtime = "nodejs";
// 60s is the max on Vercel's Hobby plan; raise to 300 if deploying on Pro.
// Responses stream, so the connection stays alive while the coach is thinking.
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

interface ChatRequest {
  messages: Pick<ChatMessage, "role" | "content">[];
  incidents?: Incident[];
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not set on the server." }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const messages = (body.messages ?? [])
    .filter((m) => m.content?.trim())
    .map((m) => ({ role: m.role, content: m.content }));

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const system = buildSystemPrompt(body.incidents ?? []);
  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          // Adaptive thinking: the coach decides when to reason more deeply.
          thinking: { type: "adaptive" },
          // Cache the large standing-context prompt across turns.
          system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
          messages,
        });

        anthropicStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await anthropicStream.finalMessage();
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        // Surface the error inline so the UI can show it in the message stream.
        controller.enqueue(encoder.encode(`\n\n[error] ${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
