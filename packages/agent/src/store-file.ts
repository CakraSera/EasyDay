// File-backed WeekStore for the dev runner. The API's Prisma store is the
// real implementation; this one exists so the harness runs without Postgres.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Week } from "@runmax/domain";
import type { WeekStore } from "./ports.js";

const dataDir = join(import.meta.dirname, "../../../.data");
const file = join(dataDir, "week-demo.json");

export function fileWeekStore(): WeekStore {
  return {
    async save(week: Week): Promise<void> {
      await mkdir(dataDir, { recursive: true });
      await writeFile(file, JSON.stringify(week, null, 2), "utf8");
    },
    async load(): Promise<Week | null> {
      try {
        return JSON.parse(await readFile(file, "utf8")) as Week;
      } catch {
        return null;
      }
    },
  };
}
