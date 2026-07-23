// Shared data shapes for DEFEND-US.

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id?: string;
  role: ChatRole;
  content: string;
  createdAt: number; // epoch ms
}

export interface Conversation {
  id?: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// Mirrors the Part 3 incident format from the operating context.
export interface Incident {
  id?: string;
  date: string;
  trigger: string;
  davidDidSaid: string;
  damiDidSaid: string;
  davidWanted: string;
  resolution: string;
  davidRead: string;
  openQuestion: string;
  createdAt: number;
}

export const EMPTY_INCIDENT: Omit<Incident, "id" | "createdAt"> = {
  date: "",
  trigger: "",
  davidDidSaid: "",
  damiDidSaid: "",
  davidWanted: "",
  resolution: "",
  davidRead: "",
  openQuestion: "",
};

// The editable "standing context" — the living document the coach reads.
export interface ContextData {
  centralTension: string;
  facts: { label: string; value: string }[];
  nonNegotiables: string[];
  assets: string[];
  selfPatterns: string[];
}

// ---------------------------------------------------------------------------
// Chat Lens — upload/paste a transcript, get it read against the manipulation-
// pattern catalogue in lib/manipulation-patterns.ts.
// ---------------------------------------------------------------------------

export interface ParsedMessage {
  speaker: string;
  text: string;
  timestamp?: string;
}

export interface AnalysisQuote {
  speaker: string;
  text: string;
}

export type AnalysisConfidence = "low" | "medium" | "high";

export interface AnalysisFinding {
  patternId: string;
  speaker: string;
  instanceCount: number;
  confidence: AnalysisConfidence;
  explanation: string;
  quotes: AnalysisQuote[];
  healthyAlternative: string;
}

export interface AnalysisResult {
  overallSummary: string;
  speakers: string[];
  findings: AnalysisFinding[];
}

export interface Analysis {
  id?: string;
  title: string;
  createdAt: number;
  sourceLabel: string;
  messageCount: number;
  result: AnalysisResult;
}
