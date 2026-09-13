// RunMax domain core. Pure logic, no React, no I/O.
// Rules live in CONTEXT.md, PRD §5–§9, and docs/adr/0001/0007/0010/0011/0012/0014.

export type Kind = "easy" | "quality" | "rest" | "walk";

export const KINDS: readonly Kind[] = ["easy", "quality", "rest", "walk"];

export const KIND_LABEL: Record<Kind, string> = {
  easy: "Easy",
  quality: "Quality",
  rest: "Rest",
  walk: "Walk",
};

export type WeekFlag = "pain" | "emptyLog";

export interface Session {
  /** YYYY-MM-DD, local calendar date. Never changes after draft. */
  date: string;
  kind: Kind;
  durationMinutes: number;
  /** Follows Kind: only quality is Hard. */
  hard: boolean;
  note: string;
}

export interface Week {
  /** Monday of this calendar week, YYYY-MM-DD (ADR 0001). */
  weekStart: string;
  /** Exactly 7 Sessions, Monday through Sunday. */
  sessions: Session[];
  flags: WeekFlag[];
  sourceLog?: string;
}

export type ViolationCode =
  | "sevenSessions"
  | "hardCount"
  | "noRestWalk"
  | "painQuality"
  | "qualityPace"
  | "diagnosis"
  | "easyQualityZero"
  | "restNotZero";

export interface Violation {
  code: ViolationCode;
  detail: string;
}

export function isHard(kind: Kind): boolean {
  return kind === "quality";
}

// ---------------------------------------------------------------------------
// Dates (local, no UTC pitfalls)
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Monday of the calendar week containing `date` (ADR 0001: Monday–Sunday). */
export function mondayOf(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toISODate(d);
}

export function dayIndex(iso: string): number {
  return (fromISODate(iso).getDay() + 6) % 7; // 0 = Monday
}

export function formatShort(iso: string): string {
  const d = fromISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatRange(weekStart: string): string {
  return `${formatShort(weekStart)} – ${formatShort(addDays(weekStart, 6))}`;
}

/**
 * The verb the PRD names as a tool: enforce product rules on a Week (drafted
 * or edited) and never let an illegal one ship (ADR 0007 / 0012 / 0014).
 */
export function checkWeek(week: Week): Violation[] {
  return validateWeek(week);
}
// ---------------------------------------------------------------------------
// Log cues (ID / EN / mixed)
// ---------------------------------------------------------------------------

// Pain / injury cues. Deliberately excludes effort words like "sore", "lelah",
// "capek": tired is training talk, not a pain gate.
const PAIN_PATTERN =
  /\b(nyeri|sakit|pegal|perih|ngilu|cedera|keseleo|painful?|hurts?|aching?|ache[ds]?|injur(?:y|ed|ies)|sprain(?:ed)?|strain(?:ed)?|tender|swollen|swelling|fracture[ds]?|shin\s+splints?)\b/i;

const HARD_CUE_PATTERN = /\b(?:hard|quality|tempo|intervals?|race|balapan|keras)\b/i;
const WALK_PATTERN = /\bjalan\b|\bwalk(?:ed|ing)?\b/i;
const MINUTES_PATTERN = /(\d{1,3})\s*(?:menit|mins?|minutes?)\b/gi;
const KM_PATTERN = /(\d{1,2}(?:[.,]\d)?)\s*(?:km|k)\b/gi;

export interface LogCues {
  pain: boolean;
  matchedPainCues: string[];
  walkRequest: boolean;
  recentHard: boolean;
  /** Rough weekly volume in minutes; km is converted at ~6 min/km. */
  roughVolumeMinutes: number | null;
}

export function parseCues(log: string): LogCues {
  const text = log ?? "";
  const painMatches = text.match(new RegExp(PAIN_PATTERN.source, "gi")) ?? [];
  const minutes = [...text.matchAll(MINUTES_PATTERN)].reduce((sum, m) => sum + Number(m[1]), 0);
  const km = [...text.matchAll(KM_PATTERN)].reduce(
    (sum, m) => sum + Number(m[1].replace(",", ".")),
    0,
  );
  return {
    pain: painMatches.length > 0,
    matchedPainCues: painMatches.map((m) => m.toLowerCase()),
    walkRequest: WALK_PATTERN.test(text),
    recentHard: HARD_CUE_PATTERN.test(text),
    roughVolumeMinutes: minutes > 0 ? minutes : km > 0 ? Math.round(km * 6) : null,
  };
}

// ---------------------------------------------------------------------------
// checkWeek (ADR 0007 / 0012 / 0014): never ship an illegal Week
// ---------------------------------------------------------------------------

// Paces, zones, set×distance, and workout-library words. Quality notes are
// minutes plus one ordinary-language line (ADR 0014).
const PACE_PATTERN =
  /\d+\s*[x×]\s*\d+|@\s*\d|\d+\s*(?:\/|per\s)\s*(?:km|k)\b|\bzone\s*\d+\b|\bpace\b|\btempo\b|\bintervals?\b|\bfartlek\b|\btrack\s+(?:session|workout|repeats)\b/i;

// A note that reads like the app diagnosed the runner. Not a medical check —
// a language gate (PRD §7: no diagnosis sentence).
const DIAGNOSIS_PATTERN =
  /\b(?:you|kamu|anda)\s+(?:have|ve\s+got|may\s+have|mengalami|memiliki|punya)\b|\bdiagnos(?:is|ed|es|e)\b|\w*itis\b|\w*algia\b|\bhernia\b|\bmeniscus\b|\bfraktur\b/i;

export function validateWeek(week: Week): Violation[] {
  const violations: Violation[] = [];
  const sessions = week.sessions;

  if (sessions.length !== 7) {
    violations.push({
      code: "sevenSessions",
      detail: `expected 7 sessions, got ${sessions.length}`,
    });
  } else {
    sessions.forEach((session, i) => {
      if (session.date !== addDays(week.weekStart, i)) {
        violations.push({
          code: "sevenSessions",
          detail: `session ${i} (${session.date}) is out of Monday–Sunday order`,
        });
      }
    });
  }

  const hardCount = sessions.filter((s) => s.hard).length;
  if (hardCount > 1) {
    violations.push({
      code: "hardCount",
      detail: `${hardCount} Hard sessions (Quality is the only Hard kind)`,
    });
  }
  for (const session of sessions) {
    if (session.hard && !isHard(session.kind)) {
      violations.push({
        code: "hardCount",
        detail: `${session.kind} cannot be Hard`,
      });
    }
  }

  const hasRestOrWalk = sessions.some((s) => s.kind === "rest" || s.kind === "walk");
  if (!hasRestOrWalk) {
    violations.push({ code: "noRestWalk", detail: "no Rest and no Walk in the week" });
  }

  if (week.flags.includes("pain") && sessions.some((s) => s.kind === "quality")) {
    violations.push({
      code: "painQuality",
      detail: "pain flag is set and a Quality is present",
    });
  }

  for (const session of sessions) {
    if (session.kind === "quality" && PACE_PATTERN.test(session.note)) {
      violations.push({
        code: "qualityPace",
        detail: "Quality note contains a pace, zone, or set×distance",
      });
    }
    if (DIAGNOSIS_PATTERN.test(session.note)) {
      violations.push({ code: "diagnosis", detail: "a note reads like a diagnosis" });
    }
    if (session.kind === "rest" && session.durationMinutes !== 0) {
      violations.push({ code: "restNotZero", detail: "Rest must be 0 minutes" });
    }
    if ((session.kind === "easy" || session.kind === "quality") && session.durationMinutes < 1) {
      violations.push({
        code: "easyQualityZero",
        detail: `${session.kind} needs at least 1 minute`,
      });
    }
    if (session.kind === "walk" && session.durationMinutes < 0) {
      violations.push({ code: "easyQualityZero", detail: "Walk minutes cannot be negative" });
    }
  }

  return violations;
}

const VIOLATION_COPY: Record<ViolationCode, string> = {
  sevenSessions: "A week is exactly seven Sessions, Monday through Sunday.",
  hardCount: "At most one Hard Session per week — Quality is the only Hard kind.",
  noRestWalk: "A week needs at least one Rest or Walk day.",
  painQuality: "Your Log mentions pain, so Quality is locked out this week.",
  qualityPace:
    "A Quality note is one ordinary line: minutes and plain words. No paces, zones, or set×distance.",
  diagnosis: "Notes can't contain a diagnosis. RunMax is not a clinic.",
  easyQualityZero: "Easy and Quality Sessions need at least 1 minute.",
  restNotZero: "A Rest day is always 0 minutes.",
};

export function humanizeViolation(code: ViolationCode): string {
  return VIOLATION_COPY[code];
}

/** "1 Quality · 4 Easy · 1 Walk · 1 Rest" — banner chrome, English. */
export function weekSummary(week: Week): string {
  const counts: Record<Kind, number> = { easy: 0, quality: 0, rest: 0, walk: 0 };
  for (const s of week.sessions) counts[s.kind] += 1;
  return `${counts.quality} Quality · ${counts.easy} Easy · ${counts.walk} Walk · ${counts.rest} Rest`;
}
