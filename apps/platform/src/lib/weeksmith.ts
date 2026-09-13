// Mock Weeksmith: the BuildThisWeek workflow as 5 verb tools (PRD §7).
// Local stand-in for the agent server; each tool is one span, one trace per
// Build. Swapping in the real API replaces runBuildThisWeek only.
import {
  addDays,
  checkWeek,
  isHard,
  mondayOf,
  parseCues,
  type Kind,
  type LogCues,
  type Session,
  type Week,
} from "./domain";

export const TOOLS = [
  "parseLog",
  "retrieveNotes",
  "draftWeek",
  "checkWeek",
  "saveWeek",
] as const;

export type ToolName = (typeof TOOLS)[number];
export type ToolStatus = "pending" | "running" | "ok" | "fail";

export interface Span {
  tool: ToolName;
  status: ToolStatus;
  ms: number;
  detail: string;
}

const sleep = (ms: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
};

// ---------------------------------------------------------------------------
// Tool 3: draftWeek — cue-driven, always legal
// ---------------------------------------------------------------------------

interface DraftPlan {
  minutes: number;
  qualityNote: string;
}

/**
 * Ordinary-language Quality note. One line, minutes + feel. Never a pace
 * (ADR 0014).
 */
function qualityNote(cues: LogCues, volume: number): string {
  if (cues.recentHard) return `${volume} min hard but relaxed, finish feeling strong`;
  return `${volume} min steady effort, stay conversational`;
}

function draftPlan(cues: LogCues): DraftPlan {
  const volume = cues.roughVolumeMinutes ?? 180;
  const easyLength = Math.max(30, Math.round((volume / 4) / 5) * 5);
  return {
    minutes: easyLength,
    qualityNote: qualityNote(cues, Math.max(20, Math.round(easyLength * 0.5 / 5) * 5)),
  };
}

function draftWeek(cues: LogCues, weekStart: string): Session[] {
  const plan = draftPlan(cues);
  const pain = cues.pain;

  // Shape per PRD §9: pain → 0 Quality; otherwise exactly 1 Quality;
  // ≥1 Rest/Walk always; the rest Easy. Saturday carries the one Quality
  // so a weekday pain cue in the Log still leaves the week plausible.
  const shape: Kind[] = pain
    ? ["easy", "walk", "easy", "easy", "walk", "easy", "rest"]
    : ["easy", "easy", "rest", "easy", "walk", "quality", "rest"];

  return shape.map((kind, i) => {
    const date = addDays(weekStart, i);
    let durationMinutes = 0;
    let note = "";
    if (kind === "easy") {
      durationMinutes = plan.minutes;
      note = "Conversation pace";
    } else if (kind === "quality") {
      durationMinutes = Math.max(20, Math.round(plan.minutes * 0.5 / 5) * 5);
      note = plan.qualityNote;
    } else if (kind === "walk") {
      durationMinutes = 30;
      note = "Easy walk, no running";
    } else {
      durationMinutes = 0;
      note = pain ? "Let the body settle" : "Full day off";
    }
    return { date, kind, durationMinutes, hard: isHard(kind), note };
  });
}

// ---------------------------------------------------------------------------
// Tool 1: parseLog — surface the cues the week will respond to
// ---------------------------------------------------------------------------

function parseLogDetail(log: string, cues: LogCues): string {
  if (!log.trim()) return "empty Log — conservative week";
  const bits: string[] = [];
  bits.push(cues.pain ? `pain cues: ${[...new Set(cues.matchedPainCues)].join(", ")}` : "no pain cues");
  if (cues.walkRequest) bits.push("walk mentioned");
  if (cues.recentHard) bits.push("recent hard effort");
  if (cues.roughVolumeMinutes !== null) bits.push(`~${cues.roughVolumeMinutes} min volume`);
  return bits.join(" · ");
}

// ---------------------------------------------------------------------------
// The workflow
// ---------------------------------------------------------------------------

export interface BuildResult {
  ok: boolean;
  week?: Week;
  /** Tool-level failure, e.g. checkWeek rejected the draft. */
  error?: string;
  spans: Span[];
}

export type SpanListener = (spans: Span[]) => void;

/** Realistic tool latency so chips animate like a live workflow. */
const TOOL_DELAY_MS: Record<ToolName, number> = {
  parseLog: 420,
  retrieveNotes: 650,
  draftWeek: 500,
  checkWeek: 380,
  saveWeek: 320,
};

const NOTE_DETAILS: Record<ToolName, string> = {
  parseLog: "", // filled at runtime
  retrieveNotes: "easy-majority · one-hard-day · rest-or-walk · pain-gate",
  draftWeek: "7 sessions drafted for this Monday",
  checkWeek: "all product rules passed",
  saveWeek: "saved as demo · overwrites this Monday",
};

export async function runBuildThisWeek(
  log: string,
  onSpan: SpanListener,
): Promise<BuildResult> {
  const spans: Span[] = TOOLS.map((tool) => ({
    tool,
    status: "pending",
    ms: 0,
    detail: NOTE_DETAILS[tool],
  }));
  const emit = () => onSpan([...spans]);
  const setSpan = (tool: ToolName, patch: Partial<Span>) => {
    const span = spans.find((s) => s.tool === tool);
    if (span) Object.assign(span, patch);
    emit();
  };

  emit();
  try {
    // 1. parseLog
    setSpan("parseLog", { status: "running" });
    const t0 = Date.now();
    await sleep(TOOL_DELAY_MS.parseLog);
    const cues = parseCues(log);
    setSpan("parseLog", {
      status: "ok",
      ms: Date.now() - t0,
      detail: parseLogDetail(log, cues),
    });

    // 2. retrieveNotes
    setSpan("retrieveNotes", { status: "running" });
    const t1 = Date.now();
    await sleep(TOOL_DELAY_MS.retrieveNotes);
    const notes = cues.pain
      ? "pain-gate · easy-majority · rest-or-walk"
      : "easy-majority · one-hard-day · rest-or-walk";
    setSpan("retrieveNotes", { status: "ok", ms: Date.now() - t1, detail: notes });

    // 3. draftWeek
    setSpan("draftWeek", { status: "running" });
    const t2 = Date.now();
    await sleep(TOOL_DELAY_MS.draftWeek);
    const weekStart = mondayOf(new Date());
    const sessions = draftWeek(cues, weekStart);
    setSpan("draftWeek", {
      status: "ok",
      ms: Date.now() - t2,
      detail: "7 sessions drafted for this Monday",
    });

    // 4. checkWeek
    setSpan("checkWeek", { status: "running" });
    const t3 = Date.now();
    await sleep(TOOL_DELAY_MS.checkWeek);
    const draft: Week = {
      weekStart,
      sessions,
      flags: [...(cues.pain ? (["pain"] as const) : []), ...(!log.trim() ? (["emptyLog"] as const) : [])],
      sourceLog: log.trim() ? log : undefined,
    };
    const violations = checkWeek(draft);
    if (violations.length > 0) {
      setSpan("checkWeek", {
        status: "fail",
        ms: Date.now() - t3,
        detail: violations.map((v) => v.detail).join("; "),
      });
      return { ok: false, error: violations[0].detail, spans };
    }
    setSpan("checkWeek", { status: "ok", ms: Date.now() - t3, detail: "all product rules passed" });

    // 5. saveWeek
    setSpan("saveWeek", { status: "running" });
    const t4 = Date.now();
    await sleep(TOOL_DELAY_MS.saveWeek);
    setSpan("saveWeek", { status: "ok", ms: Date.now() - t4, detail: "saved as demo · overwrites this Monday" });

    return { ok: true, week: draft, spans };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message, spans };
  }
}
