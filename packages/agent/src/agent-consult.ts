import { Agent, type CompletionModel, type MemoryStore, type AnyTool } from "@anvia/core";
import { CONSULT_INSTRUCTIONS } from "./prompts/consult-instructions.js";
import { getModel, defaultEffort, type WeeksmithEffort } from "./providers/openai.js";
import { tracing } from "./tracing.js";
import { createConsultTools, type ConsultStores, type Handoff } from "./tools/consult.js";

export interface CreateConsultSmithOptions {
  /** Override the gateway model id; defaults to z-ai/glm-5.3-flash. */
  modelId?: string;
  /** Reasoning effort: low | high | max. Defaults to WEEKSMITH_EFFORT or max. */
  effort?: WeeksmithEffort;
  stores: ConsultStores;
  /** Optional conversation store so Studio runs persist history. */
  memory?: { store: MemoryStore };
  /** The one-way handoff into Weeksmith's BuildThisWeek (ADR 0016). */
  handoff: Handoff;
  extraTools?: AnyTool[];
}

/**
 * ConsultSmith: the consult agent (ADR 0016). Interview → saveLog → confirm
 * → buildThisWeek handoff. Never drafts Sessions; only Weeksmith ships a Week.
 */
export function createConsultSmith(options: CreateConsultSmithOptions): Agent {
  const tools = createConsultTools(options.stores, options.handoff);
  const model: CompletionModel = getModel(options.modelId);
  const controls = { reasoningEffort: options.effort ?? defaultEffort() };
  return new Agent({
    id: "consultsmith",
    name: "ConsultSmith",
    description: "Interviews the runner, writes the Log, then hands off to Weeksmith.",
    model,
    instructions: CONSULT_INSTRUCTIONS,
    tools: [...tools, ...(options.extraTools ?? [])],
    controls,
    ...(options.memory !== undefined ? { memory: { store: options.memory.store } } : {}),
    observability: {
      observers: { langfuse: tracing },
      primaryTrace: "langfuse",
    },
  });
}
