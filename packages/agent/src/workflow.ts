// BuildThisWeek: the one-button workflow (PRD §7). One agent.generate() is
// one trace; the model must call the five verb tools in order, and saveWeek
// fails closed, so the runner-visible contract holds even on model drift.
import type { Agent } from "@anvia/core";
import type { Week } from "@runmax/domain";
import type { WeeksmithStores } from "./tools/index.js";

export interface BuildThisWeekInput {
  log: string;
  traceId?: string;
}

export interface BuildThisWeekResult {
  ok: boolean;
  week: Week | null;
  error?: string;
}

export async function runBuildThisWeek(
  agent: Agent,
  stores: WeeksmithStores,
  input: BuildThisWeekInput,
): Promise<BuildThisWeekResult> {
  try {
    const result = await agent.generate({
      prompt: buildPrompt(input.log),
      trace: { name: "BuildThisWeek", sessionId: "demo", ...(input.traceId ? { traceId: input.traceId } : {}) },
    });
    const week = await stores.weeks.load(currentWeekStart());
    if (!week) {
      return { ok: false, week: null, error: `Weeksmith finished without saving: ${result.text.slice(0, 200)}` };
    }
    return { ok: true, week };
  } catch (error) {
    return { ok: false, week: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function buildPrompt(log: string): string {
  return log.trim().length === 0
    ? "Build this week. The Log is empty."
    : `Build this week from this Log:\n\n${log.trim()}`;
}

function currentWeekStart(): string {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
}
