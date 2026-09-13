import { Agent, type CompletionModel, type MemoryStore, type AnyTool } from "@anvia/core";
import { BASE_INSTRUCTIONS } from "./prompts/base-instructions.js";
import { getModel, defaultEffort, type WeeksmithEffort } from "./providers/openai.js";
import { tracing } from "./tracing.js";
import { createWeeksmithTools, type WeeksmithStores } from "./tools/index.js";

export interface CreateWeeksmithOptions {
  /** Override the gateway model id; defaults to z-ai/glm-5.3-flash. */
  modelId?: string;
  /** Reasoning effort: low | high | max. Defaults to WEEKSMITH_EFFORT or max. */
  effort?: WeeksmithEffort;
  stores: WeeksmithStores;
  /** Optional conversation store so Studio runs persist history. */
  memory?: { store: MemoryStore };
  extraTools?: AnyTool[];
}

/**
 * Weeksmith: the single RunMax agent (PRD §7). Five verb tools, one
 * BuildThisWeek run = one trace, each tool call = one span.
 */
export function createWeeksmith(options: CreateWeeksmithOptions): Agent {
  const tools = createWeeksmithTools(options.stores);
  const model: CompletionModel = getModel(options.modelId);
  const controls = { reasoningEffort: options.effort ?? defaultEffort() };
  return new Agent({
    id: "weeksmith",
    name: "Weeksmith",
    description: "Builds this Week of running from an optional Log.",
    model,
    instructions: BASE_INSTRUCTIONS,
    tools: [...tools, ...(options.extraTools ?? [])],
    controls,
    ...(options.memory !== undefined ? { memory: { store: options.memory.store } } : {}),
    observability: {
      observers: { langfuse: tracing },
      primaryTrace: "langfuse",
    },
  });
}
