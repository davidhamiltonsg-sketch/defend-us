"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ChatMessage, Incident } from "./types";

// Data is scoped per user: users/{uid}/incidents and users/{uid}/messages.

function incidentsCol(uid: string) {
  return collection(db, "users", uid, "incidents");
}
function messagesCol(uid: string) {
  return collection(db, "users", uid, "messages");
}

// ---- Incidents ----

export function subscribeIncidents(
  uid: string,
  cb: (incidents: Incident[]) => void,
): Unsubscribe {
  const q = query(incidentsCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Incident, "id">) })));
  });
}

export async function getIncidents(uid: string): Promise<Incident[]> {
  const q = query(incidentsCol(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Incident, "id">) }));
}

export async function addIncident(
  uid: string,
  incident: Omit<Incident, "id" | "createdAt">,
): Promise<void> {
  await addDoc(incidentsCol(uid), { ...incident, createdAt: Date.now() });
}

export async function deleteIncident(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "incidents", id));
}

// ---- Chat messages ----

export function subscribeMessages(
  uid: string,
  cb: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const q = query(messagesCol(uid), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) })));
  });
}

export async function addMessage(
  uid: string,
  message: Omit<ChatMessage, "id">,
): Promise<void> {
  await addDoc(messagesCol(uid), message);
}

export async function clearMessages(uid: string): Promise<void> {
  const snap = await getDocs(messagesCol(uid));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
