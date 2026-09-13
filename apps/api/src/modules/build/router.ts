// BuildThisWeek route: POST /api/build runs the workflow and returns the
// saved Week. Illegal weeks cannot be persisted (saveWeek fails closed) and
// the response re-checks before answering (ADR 0007).
import { Hono } from "hono";
import { createWeeksmith, connectNotesMcp, runBuildThisWeek, type WeekStore } from "@runmax/agent";
import { checkWeek, type Week } from "@runmax/domain";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../utils/prisma.js";

export const buildRouter = new Hono().post("/", async (c) => {
  const body = await c.req.json<{ log?: string }>();
  const log = body.log ?? "";

  const notes = await connectNotesMcp();
  const weeks = prismaWeekStore();
  const agent = createWeeksmith({ stores: { notes, weeks } });

  try {
    const result = await runBuildThisWeek(agent, { notes, weeks }, { log });
    if (!result.ok || !result.week) {
      return c.json({ ok: false, error: result.error ?? "Build failed" }, 502);
    }
    const violations = checkWeek(result.week);
    if (violations.length > 0) {
      return c.json({ ok: false, error: `shipped week illegal: ${violations[0]?.code}` }, 500);
    }
    return c.json({ ok: true, week: result.week });
  } finally {
    await notes.close();
  }
});

function prismaWeekStore(): WeekStore {
  return {
    async save(week: Week): Promise<void> {
      const weekStart = new Date(`${week.weekStart}T00:00:00`);
      const json = week as unknown as Prisma.InputJsonValue;
      await prisma.weekRecord.upsert({
        where: { userId_weekStart: { userId: "demo", weekStart } },
        create: { userId: "demo", weekStart, week: json },
        update: { week: json },
      });
    },
    async load(): Promise<Week | null> {
      const record = await prisma.weekRecord.findFirst({ where: { userId: "demo" } });
      return record ? (record.week as unknown as Week) : null;
    },
  };
}

