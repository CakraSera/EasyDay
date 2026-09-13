// Board data routes: GET /api/week returns the stored Week for user `demo`
// (or null). PATCH applies a card edit only when checkWeek passes — illegal
// edits never stick (ADR 0007), the client shows the banner.
import { Hono } from "hono";
import type { WeekStore } from "@runmax/agent";
import { checkWeek, mondayOf, type Week } from "@runmax/domain";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../utils/prisma.js";

export const weekRouter = new Hono()
  .get("/", async (c) => {
    const week = await prismaWeekStore().load(mondayOf(new Date()));
    return c.json({ week });
  })
  .patch("/", async (c) => {
    const body = await c.req.json<{ week: Week }>();
    const next = body.week;
    const violations = checkWeek(next);
    if (violations.length > 0) {
      return c.json({ ok: false, violations }, 422);
    }
    await prismaWeekStore().save(next);
    return c.json({ ok: true, week: next });
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
    async load(weekStart: string): Promise<Week | null> {
      const record = await prisma.weekRecord.findUnique({
        where: {
          userId_weekStart: { userId: "demo", weekStart: new Date(`${weekStart}T00:00:00`) },
        },
      });
      return record ? (record.week as unknown as Week) : null;
    },
  };
}
