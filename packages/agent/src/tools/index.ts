// The five BuildThisWeek verb tools (PRD §7). Tool bodies are thin over
// @runmax/domain rules; checkWeek fails closed inside saveWeek so no flaky
// model output can ever ship an illegal Week (ADR 0007/0010/0012/0014).
import { createTool } from "@anvia/core";
import { z } from "zod";
import { checkWeek, mondayOf, parseCues, type Violation, type Week } from "@runmax/domain";
import type { NotesStore, WeekStore } from "../ports.js";

const KIND = z.enum(["easy", "quality", "rest", "walk"]);

const SessionInput = z.object({
  kind: KIND,
  durationMinutes: z.number().int().min(0).max(600),
  note: z.string().max(280).default(""),
});

const DraftInput = z.object({
  sessions: z.array(SessionInput).length(7),
  qualityNote: z.string().max(280).default(""),
});

export interface WeeksmithStores {
  notes: NotesStore;
  weeks: WeekStore;
}

export function createWeeksmithTools(stores: WeeksmithStores) {
  const parseLog = createTool({
    name: "parseLog",
    description:
      "Parse the optional ID/EN/mixed Log into cues: pain, walk request, recent hard work, rough volume. Empty Log is valid.",
    inputSchema: z.object({ log: z.string() }),
    execute: ({ log }) => parseCues(log),
  });

  const retrieveNotes = createTool({
    name: "retrieveNotes",
    description:
      "Retrieve coach notes relevant to the cues through the notes MCP server. Call before drafting.",
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }) => {
      const hits = await stores.notes.search(query);
      const notes = await Promise.all(
        hits.map(async (id) => ({ id, body: await stores.notes.read(id) })),
      );
      return { notes };
    },
  });

  const draftWeek = createTool({
    name: "draftWeek",
    description:
      "Draft 7 Sessions in order for this Monday–Sunday week. Dates and the hard flag are stamped for you; supply kind, minutes, and one-line notes in order. When pain forbids Quality, kind must not be quality.",
    inputSchema: DraftInput,
    execute: ({ sessions }) => {
      const weekStart = mondayOf(new Date());
      const stamped = sessions.map((session, index) => ({
        date: addDaysISO(weekStart, index),
        kind: session.kind,
        durationMinutes: session.kind === "rest" ? 0 : session.durationMinutes,
        hard: session.kind === "quality",
        note: session.kind === "quality" ? session.note || session.note : session.note,
      }));
      return { weekStart, sessions: stamped };
    },
  });

  const checkWeekTool = createTool({
    name: "checkWeek",
    description:
      "Enforce product rules on a drafted week. Returns violations; fix every one before saveWeek. Empty violations means legal.",
    inputSchema: z.object({
      weekStart: z.string(),
      sessions: z.array(SessionInput.extend({ date: z.string(), hard: z.boolean() })).length(7),
      flags: z.array(z.enum(["pain", "emptyLog"])),
    }),
    execute: (draft) => checkWeek(draft as unknown as Week),
  });

  const saveWeekTool = createTool({
    name: "saveWeek",
    description:
      "Save the week as the single runner record for this Monday, overwriting any earlier build. Fails if checkWeek violations exist — never call it on an illegal draft.",
    inputSchema: z.object({
      weekStart: z.string(),
      sessions: z.array(SessionInput.extend({ date: z.string(), hard: z.boolean() })).length(7),
      flags: z.array(z.enum(["pain", "emptyLog"])),
      sourceLog: z.string().optional(),
    }),
    execute: async (draft) => {
      const week = draft as unknown as Week;
      const violations: Violation[] = checkWeek(week);
      if (violations.length > 0) {
        throw new Error(
          `saveWeek blocked: illegal week — ${violations.map((v) => v.code).join(", ")}`,
        );
      }
      await stores.weeks.save(week);
      return { saved: true, weekStart: week.weekStart };
    },
  });

  return [parseLog, retrieveNotes, draftWeek, checkWeekTool, saveWeekTool];
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
