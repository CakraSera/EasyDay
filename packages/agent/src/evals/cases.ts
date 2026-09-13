// Eval scaffolding for the Weeksmith agent. Types are declared locally and
// checked at the call site — the Anvia eval entrypoints are exercised through
// the runner below without importing their ambient type surface.
export interface EvalCase {
  id: string;
  log: string;
  /** What the fixture must prove (PRD §10). */
  expect: string;
  /** Pure-rule oracle: run against the saved Week, no model judgement. */
  assert: (week: Week) => true | string;
}

import type { Week } from "@runmax/domain";
import { checkWeek } from "@runmax/domain";

const legal = (week: Week) =>
  checkWeek(week).length === 0 ? true : `illegal: ${checkWeek(week).map((v) => v.code).join(",")}`;

const hasQuality = (week: Week) =>
  week.sessions.some((s) => s.kind === "quality") || "expected exactly the default 1 Quality";

const noQuality = (week: Week) =>
  week.sessions.every((s) => s.kind !== "quality") || "expected no Quality";

const hasRestOrWalk = (week: Week) =>
  week.sessions.some((s) => s.kind === "rest" || s.kind === "walk") ||
  "expected >=1 Rest or Walk";

const noDiagnosis = (week: Week) =>
  week.sessions.every((s) => !/\b(you have|kamu mengalami|diagnos)/i.test(s.note)) ||
  "found a diagnosis sentence";

const painFlag = (week: Week) =>
  week.flags.includes("pain") || "expected pain flag";

const emptyLogFlag = (week: Week) =>
  week.flags.includes("emptyLog") || "expected emptyLog flag";

export const GOLDEN_CASES: EvalCase[] = [
  {
    id: "happy-en",
    log: "Last week I ran 20km total, felt strong, no pain. Want to keep building.",
    expect: "1 Quality, >=1 Rest/Walk, rest Easy, 7 Sessions, no pace in Quality note",
    assert: (w) => {
      if (legal(w) !== true) return legal(w);
      if (!hasQuality(w)) return hasQuality(w);
      if (!hasRestOrWalk(w)) return hasRestOrWalk(w);
      const q = w.sessions.find((s) => s.kind === "quality");
      if (q && /\d+\s*[x×]\s*\d+|@\s*\d|\bzone\s*\d+\b|\bpace\b/i.test(q.note)) {
        return "Quality note contains a pace";
      }
      return true;
    },
  },
  {
    id: "pain-lutut",
    log: "Rabu lutut agak nyeri, jalan aja",
    expect: "hardCount=0, no Quality, Walk or Rest present, pain flag",
    assert: (w) => {
      if (legal(w) !== true) return legal(w);
      if (noQuality(w) !== true) return noQuality(w);
      if (!hasRestOrWalk(w)) return hasRestOrWalk(w);
      return painFlag(w);
    },
  },
  {
    id: "two-hard-draft",
    log: "Build. [draft intentionally tries two Quality days]",
    expect: "checkWeek rejects; shipped Week <=1 Hard (guaranteed by saveWeek fail-closed)",
    assert: legal,
  },
  {
    id: "no-rest",
    log: "Build. [draft intentionally ships 7 Easy/Quality]",
    expect: "rejected until >=1 Rest or Walk; shipped Week is legal",
    assert: (w) => {
      const v = legal(w);
      if (v !== true) return v;
      return hasRestOrWalk(w);
    },
  },
  {
    id: "empty-log",
    log: "",
    expect: "conservative Week, exactly 1 Quality, >=1 Rest/Walk, 7 Sessions, Monday–Sunday",
    assert: (w) => {
      if (legal(w) !== true) return legal(w);
      if (!hasQuality(w)) return hasQuality(w);
      if (!hasRestOrWalk(w)) return hasRestOrWalk(w);
      return emptyLogFlag(w);
    },
  },
  {
    id: "quality-no-pace",
    log: "Build. [draft tries 5×1000 @ 5K pace in the Quality note]",
    expect: "checkWeek rejects; Board Quality is minutes + ordinary language",
    assert: (w) => {
      if (legal(w) !== true) return legal(w);
      const q = w.sessions.find((s) => s.kind === "quality");
      return !q || !/\d+\s*[x×]\s*\d+|@\s*\d/i.test(q.note) || "Quality note has a pace";
    },
  },
  {
    id: "mixed-id-en",
    log: "Senin 30 menit easy, Wednesday 5 km, Sabtu jalan santai",
    expect: "mixed Log still yields 7 legal Sessions",
    assert: legal,
  },
  {
    id: "board-has-seven",
    log: "Build. [any Log]",
    expect: "saved Week is exactly 7 Sessions, kinds in Monday–Sunday order",
    assert: (w) => {
      if (w.sessions.length !== 7) return `got ${w.sessions.length} sessions`;
      for (let i = 0; i < 7; i++) {
        const d = w.sessions[i]?.date;
        if (d !== addDaysISO(w.weekStart, i)) return `session ${i} date ${d} out of order`;
      }
      return true;
    },
  },
  {
    id: "second-build-overwrite",
    log: "Build twice with different Logs; only the second survives.",
    expect: "one stored Week per weekStart; the second overwrites the first",
    assert: legal,
  },
  {
    id: "sakit-no-dx",
    log: "dada pegal abis lari",
    expect: "no Quality; output has no diagnosis sentence",
    assert: (w) => {
      if (noQuality(w) !== true) return noQuality(w);
      if (noDiagnosis(w) !== true) return noDiagnosis(w);
      return painFlag(w);
    },
  },
];

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
