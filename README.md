# defend-us

A private relationship coaching agent for David — a place to think out loud, pressure-test reactions, prepare for hard conversations, and stay honest, between the moments.

Built from the operating context in `coaching-agent-prompt.md`. The coach is a [Claude](https://claude.com) agent (`claude-opus-4-8`) that holds three layers distinct — **Facts**, **David's reports**, and **Interpretation** — and is briefed to *coach, not mirror*.

## What's in it

- **Dashboard** (`/`) — the standing context the coach always holds: the central tension, the facts, the non-negotiables, the asset side, and David's own counterweight patterns.
- **Chat** (`/chat`) — streaming coaching conversation. The full charter + standing context is the system prompt; logged incidents are injected as context each turn. History persists in Firestore.
- **Incidents** (`/incidents`) — a structured log following the Part 3 format. Entries feed straight into the coach's context.

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Firebase** — Google Auth (single allow-listed account) + Firestore (incidents & chat history, scoped per user)
- **Anthropic SDK** — `claude-opus-4-8` with adaptive thinking, streamed from a server route (`/api/chat`). The API key never reaches the browser.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Firebase project** (free Spark tier is fine)
   - Enable **Authentication → Google** as a sign-in provider.
   - Create a **Firestore database**.
   - Project settings → *Your apps* → register a Web app → copy the config values.

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in:
   - `ANTHROPIC_API_KEY` — from https://console.anthropic.com/settings/keys (server-side only).
   - `NEXT_PUBLIC_FIREBASE_*` — from the Firebase web app config.
   - `NEXT_PUBLIC_ALLOWED_EMAIL` — the only Google account allowed to sign in.

4. **Lock down Firestore** — deploy the included rules so only your account can read/write:
   ```bash
   # via Firebase CLI, or paste firestore.rules into the console Rules tab
   firebase deploy --only firestore:rules
   ```
   > The rules hard-code the owner email. Update it in `firestore.rules` if `NEXT_PUBLIC_ALLOWED_EMAIL` changes.

5. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 and sign in.

## Notes

- This is a supplement, not a substitute for David's own judgment, direct conversation with Dami, or a licensed therapist/couples counsellor. The coach is briefed never to diagnose, predict the relationship's future, or instruct David to stay or leave.
- Data lives in your own Firebase project. Nothing is shared externally beyond the Anthropic API call that powers each coaching turn.
- The system prompt lives in `lib/coaching-context.ts` — edit it there if the operating context evolves.
