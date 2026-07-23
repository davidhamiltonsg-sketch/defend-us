import { NextResponse } from "next/server";
import {
  clearCollection,
  deleteDocumentPath,
  listCollection,
} from "@/lib/server/firebase-rest";
import { getValidSession } from "@/lib/server/session";

export const runtime = "nodejs";

// Permanently deletes all of the user's data. Irreversible.
export async function POST() {
  const s = await getValidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conversations = await listCollection(s.idToken, s.uid, "conversations");
  await Promise.all(
    conversations.map(async (c) => {
      await clearCollection(s.idToken, s.uid, `conversations/${c.id}/messages`);
      await deleteDocumentPath(s.idToken, s.uid, `conversations/${c.id}`);
    }),
  );
  await clearCollection(s.idToken, s.uid, "incidents");
  await clearCollection(s.idToken, s.uid, "analyses");
  await deleteDocumentPath(s.idToken, s.uid, "meta/context");
  await deleteDocumentPath(s.idToken, s.uid, "meta/memory");

  return NextResponse.json({ ok: true });
}
