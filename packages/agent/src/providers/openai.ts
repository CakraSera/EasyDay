import { OpenAIClient } from "@anvia/openai";

const apiKey = process.env.OPENAI_API_KEY ?? "";

export const openaiClient = new OpenAIClient({
  baseUrl: process.env.OPENAI_BASE_URL,
  apiKey,
});

export const WEEKSMITH_MODEL_ID = "z-ai/glm-5.3-flash";

export const WEEKSMITH_EFFORTS = ["low", "high", "max"] as const;

export type WeeksmithEffort = (typeof WEEKSMITH_EFFORTS)[number];

export const WEEKSMITH_CONTROLS = {
  reasoningEffort: {
    type: "select",
    label: "Reasoning effort",
    options: WEEKSMITH_EFFORTS,
    defaultValue: "max",
  },
} as const;

function parseEffort(value: string | undefined): WeeksmithEffort {
  return WEEKSMITH_EFFORTS.find((e) => e === value) ?? "max";
}

/**
 * Model id from WEEKSMITH_MODEL, effort from WEEKSMITH_EFFORT (default max).
 * The control value is passed per agent/run via `controls`; this handle only
 * declares what the model accepts.
 */
export function getModel(
  modelId: string = process.env.WEEKSMITH_MODEL ?? WEEKSMITH_MODEL_ID,
) {
  return openaiClient.completionModel({
    modelId,
    api: "chat",
    controls: WEEKSMITH_CONTROLS,
  });
}

export const defaultModel = getModel();

export function defaultEffort(): WeeksmithEffort {
  return parseEffort(process.env.WEEKSMITH_EFFORT);
}
