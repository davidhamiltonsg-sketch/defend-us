import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/server/session";

export const runtime = "nodejs";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export async function POST(req: Request) {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ title: "" });

  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text?.trim()) return NextResponse.json({ title: "" });

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 24,
      system:
        "Give a 3–5 word title for this conversation opener. No quotes, no punctuation, Title Case, just the title.",
      messages: [{ role: "user", content: text.slice(0, 600) }],
    });
    const title = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim()
      .replace(/^["']|["']$/g, "")
      .slice(0, 60);
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: "" });
  }
}
