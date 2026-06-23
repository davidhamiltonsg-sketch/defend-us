// Shared config. NEXT_PUBLIC_* vars are available on both server and client.
// Trim defensively in case a value was stored with stray whitespace.
export const ALLOWED_EMAIL = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL ?? "").trim();
export const FIREBASE_API_KEY = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "").trim();
export const FIREBASE_PROJECT_ID = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "").trim();

export const authConfigured = Boolean(FIREBASE_API_KEY && FIREBASE_PROJECT_ID);
