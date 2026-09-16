// Ports the agent needs from the server. apps/api implements both; the
// runner-dev harness uses the file-backed fakes.
import type { Week } from "@runmax/domain";

export interface NotesStore {
  /** Ranked note ids for a query (RAG over builder-written markdown). */
  search(query: string): Promise<string[]>;
  /** Full markdown body of one note. */
  read(id: string): Promise<string>;
}

export interface WeekStore {
  /** Upsert for user `demo` on this weekStart — overwrites this Monday (ADR 0010/0011). */
  save(week: Week): Promise<void>;
  load(weekStart: string): Promise<Week | null>;
}

/** Consult's only artifact: the optional Log text (ADR 0016). Empty is a real save. */
export interface LogStore {
  save(log: string): Promise<void>;
  load(): Promise<string>;
}
