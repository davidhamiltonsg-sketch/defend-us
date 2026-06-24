// Server-side Firebase access over REST. The browser never calls Google directly;
// these helpers run on the server (Vercel), which can reach googleapis.com.
import { FIREBASE_API_KEY, FIREBASE_PROJECT_ID } from "@/lib/config";

const IDTK = "https://identitytoolkit.googleapis.com/v1";
const SECURETOKEN = "https://securetoken.googleapis.com/v1";
const FS = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export class AuthError extends Error {}
export class FirestoreError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface SignInResult {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  uid: string;
  email: string;
}

// ---- Auth ----

export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  return identitySignIn("accounts:signInWithPassword", email, password);
}

export async function signUpWithPassword(email: string, password: string): Promise<SignInResult> {
  return identitySignIn("accounts:signUp", email, password);
}

async function identitySignIn(
  endpoint: string,
  email: string,
  password: string,
): Promise<SignInResult> {
  const res = await fetch(`${IDTK}/${endpoint}?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new AuthError(data?.error?.message || "AUTH_FAILED");
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: Number(data.expiresIn),
    uid: data.localId,
    email: data.email,
  };
}

export async function changePassword(idToken: string, password: string): Promise<void> {
  const res = await fetch(`${IDTK}/accounts:update?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken, password, returnSecureToken: false }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AuthError(data?.error?.message || "UPDATE_FAILED");
  }
}

export async function refreshIdToken(refreshToken: string): Promise<{
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  uid: string;
}> {
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
  const res = await fetch(`${SECURETOKEN}/token?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new AuthError(data?.error?.message || "REFRESH_FAILED");
  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresIn: Number(data.expires_in),
    uid: data.user_id,
  };
}

export function friendlyAuthError(code: string): string {
  switch (code) {
    case "EMAIL_NOT_FOUND":
    case "INVALID_PASSWORD":
    case "INVALID_LOGIN_CREDENTIALS":
      return "Wrong email or password.";
    case "USER_DISABLED":
      return "This account has been disabled.";
    case "EMAIL_EXISTS":
      return "That email already has an account — sign in instead.";
    case "WEAK_PASSWORD : Password should be at least 6 characters":
    case "WEAK_PASSWORD":
      return "Password should be at least 6 characters.";
    case "INVALID_EMAIL":
      return "That doesn't look like a valid email.";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Too many attempts. Wait a moment and try again.";
    case "CREDENTIAL_TOO_OLD_LOGIN_AGAIN":
      return "For security, sign out and back in before changing your password.";
    default:
      return "Something went wrong. Please try again.";
  }
}

// ---- Firestore (typed-value field conversion) ----

type FsValue = Record<string, unknown>;

function toFields(obj: Record<string, unknown>): Record<string, FsValue> {
  const fields: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "number") {
      fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    } else if (typeof v === "boolean") {
      fields[k] = { booleanValue: v };
    } else {
      fields[k] = { stringValue: String(v ?? "") };
    }
  }
  return fields;
}

function fromFields(fields: Record<string, FsValue> = {}): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(fields)) {
    if ("integerValue" in f) obj[k] = Number(f.integerValue);
    else if ("doubleValue" in f) obj[k] = Number(f.doubleValue);
    else if ("booleanValue" in f) obj[k] = Boolean(f.booleanValue);
    else if ("stringValue" in f) obj[k] = f.stringValue;
    else obj[k] = null;
  }
  return obj;
}

function docToObject(doc: { name: string; fields?: Record<string, FsValue> }) {
  const id = doc.name.split("/").pop() as string;
  return { id, ...fromFields(doc.fields) };
}

// `path` may contain slashes for nested collections, e.g. `conversations/abc/messages`.
export async function listCollection(
  idToken: string,
  uid: string,
  path: string,
): Promise<Array<Record<string, unknown>>> {
  const res = await fetch(`${FS}/users/${uid}/${path}?pageSize=300`, {
    headers: { authorization: `Bearer ${idToken}` },
  });
  if (res.status === 404) return [];
  const data = await res.json();
  if (!res.ok) throw new FirestoreError(res.status, data?.error?.message || "LIST_FAILED");
  return (data.documents || []).map(docToObject);
}

export async function addToCollection(
  idToken: string,
  uid: string,
  path: string,
  obj: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${FS}/users/${uid}/${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${idToken}`, "content-type": "application/json" },
    body: JSON.stringify({ fields: toFields(obj) }),
  });
  const data = await res.json();
  if (!res.ok) throw new FirestoreError(res.status, data?.error?.message || "ADD_FAILED");
  return docToObject(data);
}

export async function deleteFromCollection(
  idToken: string,
  uid: string,
  path: string,
  id: string,
): Promise<void> {
  const res = await fetch(`${FS}/users/${uid}/${path}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${idToken}` },
  });
  if (!res.ok && res.status !== 404) {
    const data = await res.json().catch(() => ({}));
    throw new FirestoreError(res.status, data?.error?.message || "DELETE_FAILED");
  }
}

export async function clearCollection(idToken: string, uid: string, path: string): Promise<void> {
  const docs = await listCollection(idToken, uid, path);
  await Promise.all(docs.map((d) => deleteFromCollection(idToken, uid, path, d.id as string)));
}

// ---- Single documents (e.g. meta/context, meta/memory, conversations/{id}) ----

export async function getDocument(
  idToken: string,
  uid: string,
  path: string,
): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${FS}/users/${uid}/${path}`, {
    headers: { authorization: `Bearer ${idToken}` },
  });
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new FirestoreError(res.status, data?.error?.message || "GET_FAILED");
  return fromFields(data.fields);
}

// PATCH creates the document if it doesn't exist, and sets the provided fields.
export async function setDocument(
  idToken: string,
  uid: string,
  path: string,
  obj: Record<string, unknown>,
): Promise<void> {
  const mask = Object.keys(obj)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join("&");
  const res = await fetch(`${FS}/users/${uid}/${path}?${mask}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${idToken}`, "content-type": "application/json" },
    body: JSON.stringify({ fields: toFields(obj) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new FirestoreError(res.status, data?.error?.message || "SET_FAILED");
  }
}

export async function deleteDocumentPath(idToken: string, uid: string, path: string): Promise<void> {
  const res = await fetch(`${FS}/users/${uid}/${path}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${idToken}` },
  });
  if (!res.ok && res.status !== 404) {
    const data = await res.json().catch(() => ({}));
    throw new FirestoreError(res.status, data?.error?.message || "DELETE_FAILED");
  }
}
