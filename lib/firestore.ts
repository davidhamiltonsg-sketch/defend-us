"use client";

// Client data access goes through our own API routes (same origin). The server
// talks to Firestore on the browser's behalf, so the browser never calls
// googleapis.com directly.
import type { ChatMessage, Incident } from "./types";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

// ---- Incidents ----

export async function getIncidents(): Promise<Incident[]> {
  const { incidents } = await getJSON<{ incidents: Incident[] }>("/api/incidents");
  return incidents;
}

export async function addIncident(
  incident: Omit<Incident, "id" | "createdAt">,
): Promise<void> {
  const res = await fetch("/api/incidents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(incident),
  });
  if (!res.ok) throw new Error("Couldn't save incident.");
}

export async function deleteIncident(id: string): Promise<void> {
  const res = await fetch(`/api/incidents/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Couldn't delete incident.");
}

// ---- Chat messages ----

export async function getMessages(): Promise<ChatMessage[]> {
  const { messages } = await getJSON<{ messages: ChatMessage[] }>("/api/messages");
  return messages;
}

export async function addMessage(message: Omit<ChatMessage, "id">): Promise<void> {
  await fetch("/api/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(message),
  });
}

export async function clearMessages(): Promise<void> {
  await fetch("/api/messages", { method: "DELETE" });
}
