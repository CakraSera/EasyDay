// ConsultSmith's three verb tools (ADR 0016). Interview aid, the Log save,
// and the one-way handoff into Weeksmith's BuildThisWeek. No drafting here.
import { createTool } from "@anvia/core";
import { z } from "zod";
import { parseCues } from "@runmax/domain";
import type { LogStore } from "../ports.js";

export interface ConsultStores {
  logs: LogStore;
}

export type Handoff = () => Promise<{ ok: boolean; text: string }>;

export function createConsultTools(stores: ConsultStores, handoff: Handoff) {
  const askCues = createTool({
    name: "askCues",
    description:
      "Read what is already known from the Log so far (pain, walk, recent hard, rough minutes). Call before asking the runner a question they already answered. Empty start is legal.",
    inputSchema: z.object({}),
    execute: async () => {
      const log = await stores.logs.load();
      return { log, cues: parseCues(log) };
    },
  });

  const saveLog = createTool({
    name: "saveLog",
    description:
      "Save the consult as the runner's Log: messy, first-person, ID/EN/mixed as they spoke. Empty string is a real save. This is your only artifact; call before buildThisWeek.",
    inputSchema: z.object({ log: z.string().max(2000) }),
    execute: async ({ log }) => {
      await stores.logs.save(log);
      return { saved: true, length: log.length };
    },
  });

  const buildThisWeek = createTool({
    name: "buildThisWeek",
    description:
      "Handoff: run Weeksmith's BuildThisWeek with the saved Log. Only after saveLog. Does not draft Sessions here — Weeksmith drafts, checks, and saves.",
    inputSchema: z.object({}),
    execute: async () => {
      return handoff();
    },
  });

  return [askCues, saveLog, buildThisWeek];
}
