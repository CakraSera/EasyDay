// Golden fixtures (PRD §10) over the pure rule layer. These run offline —
// no model, no gateway. Model-backed behavior gets its own evals in
// packages/agent/src/evals.
import { describe, expect, it } from "vitest";
import {
  addDays,
  checkWeek,
  mondayOf,
  parseCues,
  weekSummary,
  type Session,
  type Week,
} from "../src/domain.js";

const WEEK_START = "2026-09-07"; // a Monday

function session(
  index: number,
  kind: Session["kind"],
  overrides: Partial<Session> = {},
): Session {
  return {
    date: addDays(WEEK_START, index),
    kind,
    durationMinutes: kind === "rest" ? 0 : 30,
    hard: kind === "quality",
    note: "",
    ...overrides,
  };
}

function week(sessions: Session[], flags: Week["flags"] = []): Week {
  return { weekStart: WEEK_START, sessions, flags };
}

const LEGAL_WEEK = week([
  session(0, "easy"),
  session(1, "easy"),
  session(2, "quality", { note: "35 min steady, finish feeling strong" }),
  session(3, "rest"),
  session(4, "easy"),
  session(5, "walk", { durationMinutes: 25 }),
  session(6, "easy", { durationMinutes: 45 }),
]);

describe("boardHasSeven", () => {
  it("a legal Monday–Sunday week passes checkWeek", () => {
    expect(checkWeek(LEGAL_WEEK)).toEqual([]);
  });

  it("six or eight sessions fail sevenSessions", () => {
    expect(
      checkWeek(week(LEGAL_WEEK.sessions.slice(0, 6))).some((v) => v.code === "sevenSessions"),
    ).toBe(true);
    expect(
      checkWeek(week([...LEGAL_WEEK.sessions, session(7, "easy")])).some(
        (v) => v.code === "sevenSessions",
      ),
    ).toBe(true);
  });

  it("out-of-order dates fail sevenSessions", () => {
    const sessions = [...LEGAL_WEEK.sessions];
    sessions[1] = { ...sessions[1]!, date: addDays(WEEK_START, 3) };
    expect(checkWeek(week(sessions)).some((v) => v.code === "sevenSessions")).toBe(true);
  });

  it("weekStart keyed to this Monday", () => {
    expect(mondayOf(new Date(2026, 8, 13))).toBe("2026-09-07"); // Sunday
    expect(mondayOf(new Date(2026, 8, 7))).toBe("2026-09-07"); // Monday itself
  });
});

describe("twoHardDraft", () => {
  it("two Quality sessions are rejected", () => {
    const sessions = LEGAL_WEEK.sessions.map((s, i) =>
      i === 4 ? { ...s, kind: "quality" as const, hard: true } : s,
    );
    const violations = checkWeek(week(sessions));
    expect(violations.filter((v) => v.code === "hardCount").length).toBeGreaterThan(0);
  });

  it("hard flag without quality kind is rejected", () => {
    const sessions = LEGAL_WEEK.sessions.map((s, i) =>
      i === 0 ? { ...s, hard: true } : s,
    );
    expect(checkWeek(week(sessions)).some((v) => v.code === "hardCount")).toBe(true);
  });
});

describe("noRest", () => {
  it("seven Easy/Quality with no Rest or Walk is rejected until fixed", () => {
    const sessions = Array.from({ length: 7 }, (_, i) =>
      session(i, i === 2 ? "quality" : "easy"),
    );
    expect(checkWeek(week(sessions)).some((v) => v.code === "noRestWalk")).toBe(true);
    sessions[3] = session(3, "rest");
    expect(checkWeek(week(sessions)).some((v) => v.code === "noRestWalk")).toBe(false);
  });
});

describe("painLutut", () => {
  it("ID pain cue sets the pain flag gate", () => {
    const cues = parseCues("Rabu lutut agak nyeri, jalan aja");
    expect(cues.pain).toBe(true);
    expect(cues.walkRequest).toBe(true);
  });

  it("pain flag plus Quality is rejected", () => {
    expect(checkWeek(week(LEGAL_WEEK.sessions, ["pain"])).some((v) => v.code === "painQuality")).toBe(
      true,
    );
  });

  it("sakit-no-dx: EN pain cue, no diagnosis language needed to gate", () => {
    expect(parseCues("dada pegal abis lari").pain).toBe(true);
    expect(parseCues("leg feels sore after intervals").pain).toBe(false); // effort, not pain
  });
});

describe("qualityNoPace", () => {
  it.each([
    "5×1000 @ 4:15",
    "5x1000 @ 5K pace",
    "zone 2 for 30 min",
    "6:00/km tempo",
    "8x 400m intervals",
  ])("pace note %j is rejected", (note) => {
    const sessions = LEGAL_WEEK.sessions.map((s, i) => (i === 2 ? { ...s, note } : s));
    expect(checkWeek(week(sessions)).some((v) => v.code === "qualityPace")).toBe(true);
  });

  it("ordinary-language note passes", () => {
    const sessions = LEGAL_WEEK.sessions.map((s, i) =>
      i === 2 ? { ...s, note: "35 min steady effort, stay conversational" } : s,
    );
    expect(checkWeek(week(sessions)).some((v) => v.code === "qualityPace")).toBe(false);
  });
});

describe("sakitNoDx", () => {
  it("diagnosis sentences are rejected in any note", () => {
    for (const note of ["you have plantar fasciitis", "kamu mengalami tendinitis"]) {
      const sessions = LEGAL_WEEK.sessions.map((s, i) => (i === 2 ? { ...s, note } : s));
      expect(checkWeek(week(sessions)).some((v) => v.code === "diagnosis")).toBe(true);
    }
  });
});

describe("durations", () => {
  it("easyQualityZero: Easy and Quality need > 0 minutes", () => {
    const sessions = LEGAL_WEEK.sessions.map((s, i) =>
      i === 0 ? { ...s, durationMinutes: 0 } : s,
    );
    expect(checkWeek(week(sessions)).some((v) => v.code === "easyQualityZero")).toBe(true);
  });

  it("restNotZero: Rest must be exactly 0", () => {
    const sessions = LEGAL_WEEK.sessions.map((s, i) =>
      i === 3 ? { ...s, durationMinutes: 30 } : s,
    );
    expect(checkWeek(week(sessions)).some((v) => v.code === "restNotZero")).toBe(true);
  });
});

describe("mixedIdEn", () => {
  it("mixed Log parses pain and volume cues together", () => {
    const cues = parseCues("Senin 30 menit easy, Wednesday 5km tempo, Sabtu kaki pegal");
    expect(cues.pain).toBe(true);
    expect(cues.recentHard).toBe(true);
    expect(cues.roughVolumeMinutes).toBeGreaterThan(0);
  });

  it("empty Log is legal and parses clean", () => {
    const cues = parseCues("");
    expect(cues.pain).toBe(false);
    expect(cues.recentHard).toBe(false);
    expect(cues.roughVolumeMinutes).toBeNull();
  });
});

describe("chrome", () => {
  it("weekSummary is English banner copy", () => {
    expect(weekSummary(LEGAL_WEEK)).toBe("1 Quality · 4 Easy · 1 Walk · 1 Rest");
  });
});
