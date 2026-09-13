import { LangfuseClient } from "@anvia/langfuse";

/**
 * One Langfuse trace per BuildThisWeek run; every tool call lands as one
 * span under it (PRD §10). Wired through Agent `observability`.
 */
export const langfuse = new LangfuseClient({
  baseUrl: process.env.LANGFUSE_BASE_URL,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  environment: process.env.NODE_ENV,
  serviceName: "weeksmith",
});

export const tracing = langfuse.observer();

