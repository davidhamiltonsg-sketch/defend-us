// Shared data shapes for DEFEND-US.

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id?: string;
  role: ChatRole;
  content: string;
  createdAt: number; // epoch ms
}

// Mirrors the Part 3 incident format from the operating context.
export interface Incident {
  id?: string;
  date: string; // free text or ISO date as David enters it
  trigger: string; // behaviour only — who did/said what, in sequence
  davidDidSaid: string; // honestly, including tone, timing, withdrawal
  damiDidSaid: string; // as observed — actions and words, not assumed motives
  davidWanted: string; // the actual unmet need under the reaction
  resolution: string; // how it resolved (or didn't)
  davidRead: string; // his interpretation — what he thinks it means
  openQuestion: string; // what David actually wants help thinking about
  createdAt: number; // epoch ms
}

export const EMPTY_INCIDENT: Omit<Incident, "createdAt"> = {
  date: "",
  trigger: "",
  davidDidSaid: "",
  damiDidSaid: "",
  davidWanted: "",
  resolution: "",
  davidRead: "",
  openQuestion: "",
};
