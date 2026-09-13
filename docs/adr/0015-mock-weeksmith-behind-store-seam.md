# The Board ships on a mock Weeksmith behind the store seam

The PRD puts Week/Log storage and the BuildThisWeek tools on an agent server (user `demo`), but no server exists yet. The frontend runs the five verb tools locally (`lib/weeksmith.ts`, timed spans) and keeps the Week in a module store (`lib/store.ts`). Swapping in the real API replaces those two modules only — `app/index.tsx` and `components/` never touch transport. `checkWeek` stays the single writer in both paths, so rules do not fork.
