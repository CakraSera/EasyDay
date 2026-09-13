// Mock stand-in for the agent-server record (user `demo`, ADR 0010).
// Module singleton: survives route navigation, resets on page reload.
// Swapping this for the real API is the only change needed.
import type { Week } from "@runmax/domain";

let current: Week | null = null;

export function saveWeek(week: Week): void {
  current = week;
}

export function loadWeek(): Week | null {
  return current;
}
