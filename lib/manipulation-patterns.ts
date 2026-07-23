// The reference catalogue the analyzer checks transcripts against. Severity is
// a property of the pattern itself (how corrosive it is at any frequency), not
// of a single instance — matching how the model is instructed to reason.
import {
  ArrowRightLeft,
  ArrowUpDown,
  Drama,
  Eye,
  Hand,
  HeartCrack,
  Hourglass,
  Lock,
  RefreshCw,
  Smile,
  Users,
  VolumeX,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type PatternSeverity = "severe" | "significant" | "moderate";

export interface PatternDef {
  id: string;
  name: string;
  severity: PatternSeverity;
  summary: string;
  icon: LucideIcon;
}

export const PATTERNS: PatternDef[] = [
  {
    id: "darvo",
    name: "DARVO",
    severity: "severe",
    summary:
      "Deny, Attack, Reverse Victim and Offender (a term coined by psychologist Jennifer Freyd). When confronted about harmful behavior, the person denies it happened, attacks whoever raised it, and reframes themselves as the one being victimized.",
    icon: RefreshCw,
  },
  {
    id: "gaslighting",
    name: "Gaslighting",
    severity: "severe",
    summary:
      "Systematically making someone doubt their own memory, perception, or judgment of events, until they can no longer trust their own read of what happened.",
    icon: Eye,
  },
  {
    id: "coercive-control",
    name: "Coercive Control",
    severity: "severe",
    summary:
      "An ongoing pattern — isolation, monitoring, restriction, intimidation, or ultimatums — aimed at narrowing someone's autonomy and independence over time.",
    icon: Lock,
  },
  {
    id: "love-bombing",
    name: "Love Bombing",
    severity: "significant",
    summary:
      "Overwhelming affection, attention, or gifts — often early on, or right after conflict — used to create dependency or paper over harm rather than address it.",
    icon: HeartCrack,
  },
  {
    id: "silent-treatment",
    name: "Silent Treatment",
    severity: "significant",
    summary:
      "Deliberate, prolonged withdrawal of communication used as punishment or leverage, rather than a genuine, time-bound break to de-escalate.",
    icon: VolumeX,
  },
  {
    id: "triangulation",
    name: "Triangulation",
    severity: "significant",
    summary:
      "Pulling a third party — real, implied, or hypothetical — into a conflict to provoke jealousy, recruit validation, or destabilize the other person.",
    icon: Users,
  },
  {
    id: "intermittent-reinforcement",
    name: "Intermittent Reinforcement",
    severity: "significant",
    summary:
      "Unpredictable alternation between affection and neglect or harm — a reward pattern that is especially effective at binding someone to the relationship.",
    icon: Zap,
  },
  {
    id: "future-faking",
    name: "Future Faking",
    severity: "moderate",
    summary:
      "Promises about change, commitment, or plans made to placate in the moment, with no real intention — or track record — of following through.",
    icon: Hourglass,
  },
  {
    id: "blame-shifting",
    name: "Blame-Shifting",
    severity: "moderate",
    summary:
      "Redirecting responsibility for one's own actions onto the other person or onto circumstances, so the original behavior stops being the subject.",
    icon: ArrowRightLeft,
  },
  {
    id: "minimization",
    name: "Minimization",
    severity: "moderate",
    summary:
      "Downplaying the seriousness of harmful behavior or its impact — \"it wasn't a big deal,\" \"you're overreacting\" — to shrink the thing being addressed.",
    icon: ArrowUpDown,
  },
  {
    id: "feigned-helplessness",
    name: "Feigned Helplessness",
    severity: "moderate",
    summary:
      "Performing incompetence or incapacity to avoid a task, responsibility, or accountability that the person is actually capable of.",
    icon: Hand,
  },
  {
    id: "performative-apologies",
    name: "Performative Apologies",
    severity: "moderate",
    summary:
      "Apologies that use the right words but carry no real acknowledgment or repair — \"I'm sorry you feel that way\" — and rarely change what happens next.",
    icon: Drama,
  },
  {
    id: "brutal-honesty",
    name: "Brutal Honesty",
    severity: "moderate",
    summary:
      "Hurtful criticism or insults delivered under the banner of \"just being honest,\" where bluntness is the excuse rather than genuine, constructive feedback.",
    icon: Smile,
  },
];

export const PATTERN_MAP: Map<string, PatternDef> = new Map(PATTERNS.map((p) => [p.id, p]));

export const SEVERITY_META: Record<
  PatternSeverity,
  { label: string; text: string; border: string; bg: string; dot: string }
> = {
  severe: {
    label: "Severe",
    text: "text-[#E59A8C]",
    border: "border-[#E59A8C]/40",
    bg: "bg-[#E59A8C]/10",
    dot: "bg-[#E59A8C]",
  },
  significant: {
    label: "Significant",
    text: "text-ember",
    border: "border-ember/40",
    bg: "bg-ember/10",
    dot: "bg-ember",
  },
  moderate: {
    label: "Moderate",
    text: "text-dusk-soft",
    border: "border-dusk/40",
    bg: "bg-dusk/10",
    dot: "bg-dusk",
  },
};

export const SEVERITY_ORDER: PatternSeverity[] = ["severe", "significant", "moderate"];
