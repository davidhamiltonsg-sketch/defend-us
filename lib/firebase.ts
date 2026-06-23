"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

// Only initialise when configured — otherwise getAuth/getFirestore throw
// (auth/invalid-api-key) at module load during a build with no env present.
// Guard against re-initialising during fast refresh / multiple imports.
const app: FirebaseApp | undefined = firebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : undefined;

// These are only ever touched on the client, after a `firebaseConfigured` check
// (see lib/auth.tsx and lib/firestore.ts), so the cast is safe in practice.
export const auth: Auth = app ? getAuth(app) : (undefined as unknown as Auth);
export const db: Firestore = app ? getFirestore(app) : (undefined as unknown as Firestore);
export const googleProvider = new GoogleAuthProvider();

export const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL ?? "";
