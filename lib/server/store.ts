// Server-side load/save for the editable context and the coach's memory.
import { getDocument, setDocument } from "./firebase-rest";
import { DEFAULT_CONTEXT } from "@/lib/coaching-context";
import type { ContextData } from "@/lib/types";

export async function loadContext(idToken: string, uid: string): Promise<ContextData> {
  const doc = await getDocument(idToken, uid, "meta/context");
  const json = doc?.json;
  if (typeof json === "string" && json.trim()) {
    try {
      return JSON.parse(json) as ContextData;
    } catch {
      return DEFAULT_CONTEXT;
    }
  }
  return DEFAULT_CONTEXT;
}

export async function saveContext(idToken: string, uid: string, context: ContextData): Promise<void> {
  await setDocument(idToken, uid, "meta/context", { json: JSON.stringify(context) });
}

export async function loadMemory(idToken: string, uid: string): Promise<string> {
  const doc = await getDocument(idToken, uid, "meta/memory");
  return typeof doc?.content === "string" ? (doc.content as string) : "";
}

export async function saveMemory(idToken: string, uid: string, content: string): Promise<void> {
  await setDocument(idToken, uid, "meta/memory", { content });
}
