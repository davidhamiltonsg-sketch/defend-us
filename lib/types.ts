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
// Chat Lens — upload/paste a transcript, get it read against the manipulation
// and healthy-communication catalogues in lib/manipulation-patterns.ts. Every
// pattern in those catalogues is grounded in a cited, published source; the
// analysis is instructed to treat every speaker symmetrically — see the
// system prompt in app/api/analyze/route.ts.
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
export type FindingSeverity = "serious" | "moderate" | "minor";
export type FindingFrequency = "frequent" | "occasional" | "rare";
export type RiskLevel = "low" | "moderate" | "elevated" | "severe";

// A concerning-pattern instance — matched against PATTERNS in manipulation-patterns.ts.
export interface AnalysisFinding {
  patternId: string;
  title: string;
  severity: FindingSeverity;
  frequency: FindingFrequency;
  attribution: string; // a speaker name, or "Both"
  explanation: string;
  quotes: AnalysisQuote[];
  healthyAlternative: string;
}

// A healthy-communication instance — matched against HEALTHY_PATTERNS.
export interface HealthyFinding {
  patternId: string;
  title: string;
  frequency: FindingFrequency;
  attribution: string;
  explanation: string;
  quotes: AnalysisQuote[];
}

// One point on the tension timeline chart.
export interface TensionPoint {
  label: string;
  concernLevel: number; // 0-100
}

export interface AnalysisResult {
  riskLevel: RiskLevel;
  confidence: AnalysisConfidence;
  overallSummary: string;
  positiveObservations: string;
  areasOfConcern: string;
  tensionPatterns: string;
  recommendations: string[];
  speakers: string[];
  tensionTimeline: TensionPoint[];
  findings: AnalysisFinding[];
  healthyFindings: HealthyFinding[];
}

export const EMPTY_ANALYSIS_RESULT: AnalysisResult = {
  riskLevel: "low",
  confidence: "low",
  overallSummary: "",
  positiveObservations: "",
  areasOfConcern: "",
  tensionPatterns: "",
  recommendations: [],
  speakers: [],
  tensionTimeline: [],
  findings: [],
  healthyFindings: [],
};

export interface Analysis {
  id?: string;
  title: string;
  createdAt: number;
  sourceLabel: string;
  messageCount: number; // total messages found in the upload
  analyzedMessageCount: number; // how many were actually sent to the model
  sampled: boolean; // true when the upload was too large to send in full
  result: AnalysisResult;
}
