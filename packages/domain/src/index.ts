// RunMax domain core: Week, Session, checkWeek, Log cues, dates.
// Pure logic, no React, no I/O. Rules live in CONTEXT.md, PRD §5–§9, and
// docs/adr/0001/0007/0010/0011/0012/0014.
export {
  KINDS,
  KIND_LABEL,
  DAY_SHORT,
  DAY_LONG,
  toISODate,
  fromISODate,
  addDays,
  mondayOf,
  dayIndex,
  formatShort,
  formatRange,
  checkWeek,
  validateWeek,
  humanizeViolation,
  weekSummary,
  parseCues,
  isHard,
} from "./domain.js";

export type {
  Kind,
  WeekFlag,
  Session,
  Week,
  ViolationCode,
  Violation,
  LogCues,
} from "./domain.js";
