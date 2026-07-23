import { NextResponse } from "next/server";
import { listCollection } from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";
import { loadContext, loadMemory } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [context, memory, incidents, conversations, analyses] = await Promise.all([
    loadContext(s.idToken, s.uid),
    loadMemory(s.idToken, s.uid),
    listCollection(s.idToken, s.uid, "incidents"),
    listCollection(s.idToken, s.uid, "conversations"),
    listCollection(s.idToken, s.uid, "analyses"),
  ]);

  const withMessages = await Promise.all(
    conversations.map(async (c) => ({
      ...c,
      messages: await listCollection(s.idToken, s.uid, `conversations/${c.id}/messages`),
    })),
  );

  const payload = {
    exportedAt: new Date().toISOString(),
    account: s.email,
    context,
    memory,
    incidents,
    conversations: withMessages,
    analyses,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="defend-us-export.json"`,
    },
  });
}
