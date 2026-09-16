// ConsultThenBuild: the consult workflow (ADR 0016). One consult run
// (interview → saveLog → confirm → buildThisWeek); the handoff nests
// Weeksmith's BuildThisWeek. Consult never drafts: the only Week comes
// from the nested Build, and only if the model confirmed the handoff.
import type { Agent } from "@anvia/core";
import type { Week } from "@runmax/domain";
import { createConsultSmith } from "./agent-consult.js";
import type { ConsultStores } from "./tools/consult.js";
import type { WeeksmithStores } from "./tools/index.js";
import { runBuildThisWeek, type BuildThisWeekResult } from "./workflow.js";
import type { WeeksmithEffort } from "./providers/openai.js";

export interface ConsultThenBuildInput {
  /** The confirmed consult utterances, first-person, ID/EN/mixed. */
  transcript: string;
  traceId?: string;
}

export interface ConsultDeps {
  consultStores: ConsultStores;
  weeksmith: Agent;
  weeksmithStores: WeeksmithStores;
  modelId?: string;
  effort?: WeeksmithEffort;
}

export interface ConsultThenBuildResult {
  ok: boolean;
  /** The Log ConsultSmith saved — empty is legal. */
  log: string;
  week: Week | null;
  error?: string;
}

export async function runConsultThenBuild(
  deps: ConsultDeps,
  input: ConsultThenBuildInput,
): Promise<ConsultThenBuildResult> {
  // The handoff closure: buildThisWeek resolves this when the model confirms.
  let build: Promise<BuildThisWeekResult> | null = null;

  const consult = createConsultSmith({
    stores: deps.consultStores,
    modelId: deps.modelId,
    effort: deps.effort,
    handoff: async () => {
      // Read the Log at execution time — saveLog has run by contract (ADR 0016).
      const log = await deps.consultStores.logs.load();
      build = runBuildThisWeek(deps.weeksmith, deps.weeksmithStores, { log });
      const r = await build;
      return {
        ok: r.ok,
        text: r.ok ? "Week built and saved." : `Build failed: ${r.error ?? "unknown"}`,
      };
    },
  });

  try {
    const result = await consult.generate({
      prompt: consultPrompt(input.transcript),
      trace: {
        name: "ConsultThenBuild",
        sessionId: "demo",
        ...(input.traceId ? { traceId: input.traceId } : {}),
      },
    });

    const log = await deps.consultStores.logs.load();
    if (build === null) {
      return {
        ok: false,
        log,
        week: null,
        error: `Consult ended without a confirmed build: ${result.text.slice(0, 200)}`,
      };
    }
    const buildResult = (await build) as BuildThisWeekResult;
    return { ...buildResult, log };
  } catch (error) {
    return {
      ok: false,
      log: await safeLoad(deps.consultStores),
      week: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
function consultPrompt(transcript: string): string {
  const t = transcript.trim();
  const confirmed =
    "The runner has already answered yes to Build this week. In this single turn: saveLog with their words, then immediately buildThisWeek. Do not stop to ask again.";
  return t.length === 0
    ? `Consult. The runner said nothing that changes the week. ${confirmed}`
    : `Consult from this runner conversation:\n\n${t}\n\n${confirmed}`;
}

async function safeLoad(stores: ConsultStores): Promise<string> {
  try {
    return await stores.logs.load();
  } catch {
    return "";
  }
}
