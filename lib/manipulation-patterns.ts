// The reference catalogues the analyzer checks transcripts against — one for
// concerning patterns, one for healthy/protective ones. Every entry carries a
// citation to a named published source; the analyze route is instructed to
// only use these definitions, not invent new pop-psychology terms, and to
// treat every speaker in a transcript symmetrically.
//
// NOTE ON CITATIONS: entries are sourced from established clinical/academic
// literature. A handful of colloquial terms (love bombing, future faking,
// "weaponized" incompetence) don't map to a single peer-reviewed coinage —
// those are marked `citationConfidence: "related"` and point to the closest
// legitimate research construct instead of a false-precision citation.
import {
  ArrowRightLeft,
  ArrowUpDown,
  Drama,
  Ear,
  Eye,
  Hand,
  HeartCrack,
  HeartHandshake,
  Hourglass,
  Lock,
  MessageCircleHeart,
  PauseCircle,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Shuffle,
  Smile,
  Sparkles,
  Undo2,
  Users,
  VolumeX,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type PatternSeverity = "severe" | "significant" | "moderate";
type CitationConfidence = "high" | "medium" | "related";

export interface PatternDef {
  id: string;
  name: string;
  severity: PatternSeverity;
  summary: string;
  citation: string;
  citationConfidence: CitationConfidence;
  icon: LucideIcon;
}

export interface HealthyPatternDef {
  id: string;
  name: string;
  summary: string;
  citation: string;
  citationConfidence: CitationConfidence;
  icon: LucideIcon;
}

export const PATTERNS: PatternDef[] = [
  {
    id: "darvo",
    name: "DARVO",
    severity: "severe",
    summary:
      "Deny, Attack, Reverse Victim and Offender. When confronted about harmful behavior, the person denies it happened, attacks whoever raised it, and reframes themselves as the one being victimized.",
    citation: "Freyd, J.J. (1997). Violations of power, adaptive blindness, and betrayal trauma theory. Feminism & Psychology, 7(1), 22–32.",
    citationConfidence: "high",
    icon: RefreshCw,
  },
  {
    id: "gaslighting",
    name: "Gaslighting",
    severity: "severe",
    summary:
      "Systematically making someone doubt their own memory, perception, or judgment of events, until they can no longer trust their own read of what happened.",
    citation: "Stern, R. (2007). The Gaslight Effect. Morgan Road Books. Not a clinical/DSM term — a popularized construct, not a single peer-reviewed coinage.",
    citationConfidence: "medium",
    icon: Eye,
  },
  {
    id: "coercive-control",
    name: "Coercive Control",
    severity: "severe",
    summary:
      "An ongoing pattern — isolation, monitoring, restriction, intimidation, or ultimatums — aimed at narrowing someone's autonomy and independence over time.",
    citation: "Stark, E. (2007). Coercive Control: How Men Entrap Women in Personal Life. Oxford University Press.",
    citationConfidence: "high",
    icon: Lock,
  },
  {
    id: "love-bombing",
    name: "Love Bombing",
    severity: "significant",
    summary:
      "Overwhelming affection, attention, or gifts — often early on, or right after conflict — used to create dependency or paper over harm rather than address it.",
    citation: "No academic coiner — the term originated in 1970s cult-recruitment contexts, formalized descriptively by Singer, M.T. (1996). Cults in Our Midst. Its extension to romantic relationships is real but comparatively thin research territory.",
    citationConfidence: "related",
    icon: HeartCrack,
  },
  {
    id: "silent-treatment",
    name: "Silent Treatment",
    severity: "significant",
    summary:
      "Deliberate, prolonged withdrawal of communication used as punishment or leverage, rather than a genuine, time-bound break to de-escalate.",
    citation: "Two related constructs: Williams, K.D., Shore, W.J., & Grahe, J.E. (1998). Group Processes & Intergroup Relations, 1(2), 117–141 (ostracism as punishment); Gottman, J.M., & Levenson, R.W. (1992). JPSP, 63(2), 221–233 ('stonewalling', one of the Four Horsemen).",
    citationConfidence: "high",
    icon: VolumeX,
  },
  {
    id: "defensiveness",
    name: "Defensiveness",
    severity: "significant",
    summary:
      "Meeting a raised concern with self-protective counter-attack, excuse-making, or reversing blame back onto the other person — treating being at fault as an accusation to repel rather than something to hear.",
    citation: "Gottman, J.M., & Levenson, R.W. (1992). JPSP, 63(2), 221–233 — one of the Four Horsemen, alongside stonewalling.",
    citationConfidence: "high",
    icon: ShieldOff,
  },
  {
    id: "triangulation",
    name: "Triangulation",
    severity: "significant",
    summary:
      "Pulling a third party — real, implied, or hypothetical — into a conflict to provoke jealousy, recruit validation, or destabilize the other person.",
    citation: "Bowen, M. (1978). Family Therapy in Clinical Practice. Jason Aronson — family systems theory.",
    citationConfidence: "high",
    icon: Users,
  },
  {
    id: "intermittent-reinforcement",
    name: "Intermittent Reinforcement",
    severity: "significant",
    summary:
      "Unpredictable alternation between affection and neglect or harm — a reward pattern that is especially effective at binding someone to the relationship.",
    citation: "Dutton, D.G., & Painter, S.L. (1981). Traumatic bonding: The development of emotional attachments in battered women and other relationships of intermittent abuse. Victimology, 6(1–4), 139–155.",
    citationConfidence: "high",
    icon: Zap,
  },
  {
    id: "future-faking",
    name: "Future Faking",
    severity: "moderate",
    summary:
      "Promises about change, commitment, or plans made to placate in the moment, with no real intention — or track record — of following through.",
    citation: "No academic source — a popular-recovery-content term, not peer-reviewed. Closest legitimate construct: intermittent reinforcement / idealization–devaluation cycling (Dutton & Painter, 1981, Victimology).",
    citationConfidence: "related",
    icon: Hourglass,
  },
  {
    id: "deflection",
    name: "Deflection",
    severity: "moderate",
    summary:
      "Answering a direct question or concern by changing the subject, countering with a different question, or responding with vague reassurance — so the original point is never actually addressed. Distinct from blame-shifting: it avoids the substance rather than redirecting fault.",
    citation: "Related construct: Christensen, A., & Heavey, C.L. (1990). Gender and social structure in the demand/withdraw pattern of marital conflict. Journal of Personality and Social Psychology, 59(1), 73–81 — the withdraw side of demand-withdraw.",
    citationConfidence: "medium",
    icon: Shuffle,
  },
  {
    id: "conflict-appeasement",
    name: "Conflict Appeasement",
    severity: "moderate",
    summary:
      "Making a promise or concession specifically to end an argument in the moment, with no follow-through afterward — distinct from a genuine repair attempt (which changes behavior) and from Future Faking (which is about broader relationship/future commitments rather than in-the-moment capitulation).",
    citation: "No single academic coiner. Related to the absence of Gottman's 'taking responsibility' antidote (Gottman & Silver, 1999) and, when the promise-then-nothing cycle repeats, to intermittent-reinforcement research (Dutton & Painter, 1981, Victimology).",
    citationConfidence: "related",
    icon: Undo2,
  },
  {
    id: "blame-shifting",
    name: "Blame-Shifting",
    severity: "moderate",
    summary:
      "Redirecting responsibility for one's own actions onto the other person or onto circumstances, so the original behavior stops being the subject.",
    citation: "No single academic coiner for the term itself. Closest construct: Miller, D.T., & Ross, M. (1975). Self-serving biases in the attribution of causality. Psychological Bulletin, 82(2), 213–225.",
    citationConfidence: "medium",
    icon: ArrowRightLeft,
  },
  {
    id: "minimization",
    name: "Minimization",
    severity: "moderate",
    summary:
      "Downplaying the seriousness of harmful behavior or its impact — \"it wasn't a big deal,\" \"you're overreacting\" — to shrink the thing being addressed.",
    citation: "Harsey, S., & Freyd, J.J. (2020). DARVO: What is the influence on perceived perpetrator and victim credibility? Journal of Aggression, Maltreatment & Trauma. Minimization is the 'Deny' component of DARVO.",
    citationConfidence: "high",
    icon: ArrowUpDown,
  },
  {
    id: "feigned-helplessness",
    name: "Feigned Helplessness",
    severity: "moderate",
    summary:
      "Performing incompetence or incapacity to avoid a task, responsibility, or accountability that the person is actually capable of.",
    citation: "No formal academic term. Closest constructs: Seligman, M.E.P., & Maier, S.F. (1967), learned helplessness; Lerner, H.G. (1985). The Dance of Anger, on over-/under-functioning in couples.",
    citationConfidence: "related",
    icon: Hand,
  },
  {
    id: "performative-apologies",
    name: "Performative Apologies",
    severity: "moderate",
    summary:
      "Apologies that use the right words but carry no real acknowledgment or repair — \"I'm sorry you feel that way\" — and rarely change what happens next.",
    citation: "No clinical coiner for 'non-apology apology' itself. Best defined against Lazare, A. (2004). On Apology. Oxford University Press — an effective apology requires acknowledgment, explanation, remorse, and reparation; this pattern is the absence of those.",
    citationConfidence: "medium",
    icon: Drama,
  },
  {
    id: "brutal-honesty",
    name: "Brutal Honesty",
    severity: "moderate",
    summary:
      "Hurtful criticism or insults delivered under the banner of \"just being honest,\" where bluntness is the excuse rather than genuine, constructive feedback.",
    citation: "Infante, D.A., & Wigley, C.J. (1986). Verbal aggressiveness: An interpersonal model and measure. Communication Monographs, 53(1), 61–69. 'Brutal honesty' is the closest popular label for this construct, not an exact synonym.",
    citationConfidence: "medium",
    icon: Smile,
  },
];

export const HEALTHY_PATTERNS: HealthyPatternDef[] = [
  {
    id: "i-statements",
    name: "\"I\" Statements",
    summary:
      "Expressing feelings and impact from one's own experience (\"I felt hurt when...\") rather than accusatory \"you\" framing that puts the other person on the defensive.",
    citation: "Rosenberg, M.B. (1999). Nonviolent Communication: A Language of Life. PuddleDancer Press. Precursor: Gordon, T. (1970). Parent Effectiveness Training — 'I-messages'.",
    citationConfidence: "high",
    icon: MessageCircleHeart,
  },
  {
    id: "active-listening",
    name: "Active Listening",
    summary:
      "Reflecting back what the other person said before responding — signalling that they were actually heard, not just waited out.",
    citation: "Rogers, C.R., & Farson, R.E. (1957). Active Listening. Industrial Relations Center, University of Chicago. (Rogers's own term was 'reflective listening'; Farson coined 'active listening'.)",
    citationConfidence: "high",
    icon: Ear,
  },
  {
    id: "repair-attempts",
    name: "Repair Attempts",
    summary:
      "Any statement or action — a joke, an apology, a physical gesture — aimed at de-escalating tension before it spirals, and the partner accepting it.",
    citation: "Gottman, J.M., & Silver, N. (1999). The Seven Principles for Making Marriage Work.",
    citationConfidence: "high",
    icon: HeartHandshake,
  },
  {
    id: "genuine-accountability",
    name: "Genuine Accountability",
    summary:
      "An apology that names the specific action, its impact, and what will change — the structural opposite of a performative apology.",
    citation: "Lazare, A. (2004). On Apology. Oxford University Press.",
    citationConfidence: "high",
    icon: ShieldCheck,
  },
  {
    id: "self-soothing-breaks",
    name: "Time-Bound Breaks",
    summary:
      "Explicitly naming the need for a pause and committing to return, to de-escalate physiological flooding — distinct from silent treatment because it's named and time-bound.",
    citation: "Gottman, J.M., & Silver, N. (1999). The Seven Principles for Making Marriage Work, building on flooding research in Gottman & Levenson (1992). JPSP, 63(2), 221–233.",
    citationConfidence: "high",
    icon: PauseCircle,
  },
  {
    id: "turning-toward",
    name: "Turning Toward Bids",
    summary:
      "Responding with attention and warmth to a partner's small bids for connection, rather than ignoring or deflecting them.",
    citation: "Gottman, J.M., & DeClaire, J. (2001). The Relationship Cure. Crown. (Widely cited 86%/33% figures are Gottman's own lab reporting, not a standalone peer-reviewed table.)",
    citationConfidence: "high",
    icon: Wind,
  },
  {
    id: "perspective-taking",
    name: "Perspective-Taking",
    summary:
      "Explicitly trying on the other person's point of view before responding — asking what it looked like from their side.",
    citation: "Not a separately named construct — inferred from the Four Horsemen antidotes in Gottman, J.M., & Silver, N. (1999). The Seven Principles for Making Marriage Work.",
    citationConfidence: "medium",
    icon: Sparkles,
  },
];

export const PATTERN_MAP: Map<string, PatternDef> = new Map(PATTERNS.map((p) => [p.id, p]));
export const HEALTHY_PATTERN_MAP: Map<string, HealthyPatternDef> = new Map(HEALTHY_PATTERNS.map((p) => [p.id, p]));

export const SEVERITY_META: Record<
  PatternSeverity,
  { label: string; text: string; border: string; bg: string; dot: string }
> = {
  severe: { label: "Severe", text: "text-[#E59A8C]", border: "border-[#E59A8C]/40", bg: "bg-[#E59A8C]/10", dot: "bg-[#E59A8C]" },
  significant: { label: "Significant", text: "text-ember", border: "border-ember/40", bg: "bg-ember/10", dot: "bg-ember" },
  moderate: { label: "Moderate", text: "text-dusk-soft", border: "border-dusk/40", bg: "bg-dusk/10", dot: "bg-dusk" },
};

export const SEVERITY_ORDER: PatternSeverity[] = ["severe", "significant", "moderate"];

// Per-instance severity (distinct from the pattern's inherent tier above) —
// how bad this specific occurrence reads in context.
export const FINDING_SEVERITY_META: Record<
  "serious" | "moderate" | "minor",
  { label: string; text: string; border: string; bg: string }
> = {
  serious: { label: "Serious", text: "text-[#E59A8C]", border: "border-[#E59A8C]/40", bg: "bg-[#E59A8C]/10" },
  moderate: { label: "Moderate", text: "text-ember", border: "border-ember/40", bg: "bg-ember/10" },
  minor: { label: "Minor", text: "text-smoke", border: "border-night-hair", bg: "bg-night-input" },
};

export const FREQUENCY_LABEL: Record<"frequent" | "occasional" | "rare", string> = {
  frequent: "Frequent",
  occasional: "Occasional",
  rare: "Rare",
};

export const RISK_META: Record<"low" | "moderate" | "elevated" | "severe", { label: string; text: string; bar: string }> = {
  low: { label: "Low", text: "text-moss", bar: "bg-moss" },
  moderate: { label: "Moderate", text: "text-dusk-soft", bar: "bg-dusk" },
  elevated: { label: "Elevated", text: "text-ember", bar: "bg-ember" },
  severe: { label: "Severe", text: "text-[#E59A8C]", bar: "bg-[#E59A8C]" },
};

export const RISK_ORDER: Array<"low" | "moderate" | "elevated" | "severe"> = ["low", "moderate", "elevated", "severe"];
