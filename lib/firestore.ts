"use client";

// Client data access goes through our own API routes (same origin). The server
// talks to Firestore on the browser's behalf, so the browser never calls
// googleapis.com directly.
import type { Analysis, ChatMessage, ContextData, Conversation, Incident } from "./types";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("du:unauthorized"));
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new HttpError(res.status, (data as { error?: string })?.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

function body(data: unknown): RequestInit {
  return { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) };
}

// ---- Context ----
export async function getContext(): Promise<ContextData> {
  return (await req<{ context: ContextData }>("/api/context")).context;
}
export async function saveContext(context: ContextData): Promise<void> {
  await req("/api/context", { ...body(context), method: "PUT" });
}

// ---- Memory ----
export async function getMemory(): Promise<string> {
  return (await req<{ memory: string }>("/api/memory")).memory;
}
export async function saveMemory(memory: string): Promise<void> {
  await req("/api/memory", { ...body({ memory }), method: "PUT" });
}

// ---- Conversations ----
export async function listConversations(): Promise<Conversation[]> {
  return (await req<{ conversations: Conversation[] }>("/api/conversations")).conversations;
}
export async function createConversation(title?: string): Promise<Conversation> {
  return (await req<{ conversation: Conversation }>("/api/conversations", body({ title }))).conversation;
}
export async function renameConversation(id: string, title: string): Promise<void> {
  await req(`/api/conversations/${id}`, { ...body({ title }), method: "PATCH" });
}
export async function deleteConversation(id: string): Promise<void> {
  await req(`/api/conversations/${id}`, { method: "DELETE" });
}

// ---- Messages (per conversation) ----
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  return (await req<{ messages: ChatMessage[] }>(`/api/conversations/${conversationId}/messages`)).messages;
}
export async function addMessage(conversationId: string, message: Omit<ChatMessage, "id">): Promise<void> {
  await req(`/api/conversations/${conversationId}/messages`, body(message));
}

// ---- Incidents ----
export async function getIncidents(): Promise<Incident[]> {
  return (await req<{ incidents: Incident[] }>("/api/incidents")).incidents;
}
export async function addIncident(incident: Omit<Incident, "id" | "createdAt">): Promise<void> {
  await req("/api/incidents", body(incident));
}
export async function updateIncident(id: string, incident: Omit<Incident, "id" | "createdAt">): Promise<void> {
  await req(`/api/incidents/${id}`, { ...body(incident), method: "PUT" });
}
export async function deleteIncident(id: string): Promise<void> {
  await req(`/api/incidents/${id}`, { method: "DELETE" });
}

export async function generateTitle(text: string): Promise<string> {
  try {
    return (await req<{ title: string }>("/api/title", body({ text }))).title || "";
  } catch {
    return "";
  }
}

// ---- Chat Lens (transcript analysis) ----
export async function listAnalyses(): Promise<Analysis[]> {
  return (await req<{ analyses: Analysis[] }>("/api/analyses")).analyses;
}
export async function analyzeChat(raw: string, filename?: string, title?: string): Promise<Analysis> {
  return (await req<{ analysis: Analysis }>("/api/analyze", body({ raw, filename, title }))).analysis;
}
export async function deleteAnalysis(id: string): Promise<void> {
  await req(`/api/analyses/${id}`, { method: "DELETE" });
}

// ---- Account ----
export async function changePassword(password: string): Promise<void> {
  await req("/api/auth/password", body({ password }));
}
export async function wipeAll(): Promise<void> {
  await req("/api/wipe", { method: "POST" });
}
