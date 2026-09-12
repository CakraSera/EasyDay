# Repository Guidelines

Expo **HAS CHANGED**. Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

`CLAUDE.md` is `@AGENTS.md` — this file is the single assistant brief.

## Project Overview

**RunMax** (Expo app still named EasyDay) is a runner’s **this Week** of running from an optional messy **Log**, shown as a **Board** on mobile-first Expo web. **VO2 max** is why-copy only. Not a 16-week calendar, not a chatbot, not a clinic, not WhatsApp, not a race Goal.

Canonical terms live in [`CONTEXT.md`](CONTEXT.md). Use those words in code, evals, and UI copy. Honor each term’s **Avoid** list (no “plan”, “workout”, “calendar”, “chatbot”, “generate”, …).

v1 scope is locked in [`document/PRD.en.md`](document/PRD.en.md) (Indonesian twin: [`document/PRD.id.md`](document/PRD.id.md); object names stay English). Decisions: [`docs/adr/`](docs/adr/).

**Live code is still a blank Expo SDK 54 reset.** Spec is ahead of implementation. Build the Board at `/`; do not treat `app-example/` as product code.

## Architecture & Data Flow

**Intended (PRD §7, unimplemented):**

```
optional Log  →  Build this week  →  Weeksmith / BuildThisWeek
                                      │
              parseLog → retrieveNotes → draftWeek → checkWeek → saveWeek
                                      │
                                   Board (7 Session cards, Mon–Sun)
```

- **Agent:** `Weeksmith`. **Workflow:** `BuildThisWeek`. Five verb tools only — no `doAnything`, no `loadGoal`.
- **MCP:** `notes` (`searchNotes`, `readNote`) over builder-written markdown, not copyrighted books.
- **Persistence:** Week + optional Log as one unauthenticated server record (`user: demo`). Rebuild **overwrites this Monday**. Older Mondays are not kept ([ADR 0010](docs/adr/0010-week-and-log-not-goal.md), [ADR 0011](docs/adr/0011-no-past-weeks.md)).
- **Home is the Board**, not chat. No **Why?** drawer. Failures = banner on the Board.

**Actual (today):**

`package.json` `"main": "expo-router/entry"` → [`app/_layout.tsx`](app/_layout.tsx) (bare `<Stack />`) → [`app/index.tsx`](app/index.tsx) (placeholder). No providers, no data layer, no Weeksmith, no persistence.

Load-bearing product rules (enforce in `checkWeek` and at card-tap; never render an illegal Week):

- Week = exactly 7 Sessions, Monday–Sunday, keyed by `weekStart` ([ADR 0001](docs/adr/0001-this-week-is-monday-sunday.md)).
- ≤1 Hard Session (`quality` is Hard; `easy` | `rest` | `walk` are not). No `race` Kind ([ADR 0010](docs/adr/0010-week-and-log-not-goal.md)).
- ≥1 Rest or Walk.
- Pain in Log → no Quality, no running intervals, no diagnosis.
- Quality note is minutes + ordinary language; paces / set×distance fail `checkWeek` ([ADR 0014](docs/adr/0014-quality-is-one-line.md)).
- Rest duration = 0 min; Walk may have minutes; Easy/Quality must be > 0 ([ADR 0012](docs/adr/0012-duration-without-race.md)).
- Illegal Kind edits blocked at tap with a banner ([ADR 0007](docs/adr/0007-checkweek-blocks-illegal-edits.md)).
- No past Weeks list ([ADR 0011](docs/adr/0011-no-past-weeks.md)).

v1 surface is **Expo 54 web, phone width** ([ADR 0004](docs/adr/0004-web-mobile-first.md)). No store builds, no WhatsApp ([ADR 0003](docs/adr/0003-board-only-no-whatsapp.md)).

## Key Directories

| Path | Role |
|---|---|
| `app/` | **Live** expo-router routes. Only `_layout.tsx` and `index.tsx` today. New screens = new files here. Board belongs at `/`. |
| `app-example/` | Leftover create-expo-app starter (tabs demo, themed components). **Not product code.** Gitignored. Do not import from it. |
| `assets/images/` | Expo config icons/splash/favicon only. Do not use leftover `react-logo*.png` in product UI. |
| `document/` | Bilingual PRD. Update **both** `PRD.en.md` and `PRD.id.md`. |
| `docs/adr/` | Short title+rationale ADRs `0001`–`0014`. New architecture → next `00NN-kebab.md`. |
| `scripts/reset-project.js` | Destructive Expo scaffold reset. **Do not run.** |

No root `src/`, `components/`, `hooks/`, `lib/`, or `stores/` yet. When added, keep them at repo root so `@/` aliases work (`@/*` → `./*`).

## Development Commands

Package manager is **pnpm** (`pnpm-lock.yaml` v9). Never npm/yarn/bun.

```bash
pnpm install
pnpm start                 # expo start
pnpm run web               # expo start --web  (v1 target)
pnpm run android           # expo start --android
pnpm run ios               # expo start --ios
pnpm run lint              # expo lint
pnpm exec tsc --noEmit     # no package.json typecheck script
```

**Never** `pnpm run reset-project` — it moves/deletes `app/`, `components/`, `hooks/`, `constants/`, and `scripts/` (including itself).

No `test` script exists.

## Code Conventions & Common Patterns

- **Language:** TypeScript `strict`. Default-export named function components per route (`RootLayout`, `Index`). Double quotes. Inline style objects in the placeholder; prefer `StyleSheet.create` for real UI.
- **Routing:** expo-router v6 file-based. `experiments.typedRoutes: true` — typed `href`s. New route = file under `app/`.
- **Imports:** `@/foo` maps to repo root (`tsconfig.json` `paths`).
- **React Compiler** is on (`app.json` `experiments.reactCompiler`). Do not add needless `useMemo`/`useCallback`.
- **Web first:** every screen must work on `react-native-web`. Phone-width, one column. UI chrome is English; Logs may be ID/EN/mixed.
- **Domain naming in identifiers and copy:** `Week`, `Session`, `kind`, `hard`, `Log`, `Pain`, `Board`, `Weeksmith`, `BuildThisWeek`. Kind values: `easy` \| `quality` \| `rest` \| `walk`. No `Goal`, no `race`.
- **State / DI:** none in live code. When added: Week + optional Log on the agent server (`demo`), not device-only storage ([ADR 0010](docs/adr/0010-week-and-log-not-goal.md)). Keep root layout provider-minimal until needed.
- **Errors:** Board banner, not a conversation. `checkWeek` fails closed (never ship `hardCount > 1`, 0 Rest/Walk, pain+Quality, ≠7 Sessions, a pace in the Quality note, or a diagnosis sentence).
- **Async:** none yet. BuildThisWeek tools should be verb-named functions, one span each, one trace per Build.
- **Native dirs:** `/ios` and `/android` are gitignored (CNG). Config lives in `app.json`. Do not hand-edit generated native folders.
- **Do not edit** generated `expo-env.d.ts` (gitignored).

Template leftovers under `app-example/` (kebab-case files, `.ios.tsx` / `.web.ts` suffixes, themed wrappers) are **reference only**.

## Important Files

| File | Why |
|---|---|
| `app/_layout.tsx` | Root layout / providers. |
| `app/index.tsx` | Home — replace with Board. |
| `package.json` | `name: easyday`, `main: expo-router/entry`. |
| `app.json` | Identity: name `EasyDay`, slug/scheme `easyday`. `newArchEnabled`, typedRoutes, reactCompiler. |
| `tsconfig.json` | `strict`, `@/*`, include **only** `app/**` + `.expo/types` + `expo-env.d.ts`. |
| `eslint.config.js` | ESLint 9 flat + `eslint-config-expo/flat`; ignores `dist/*`. |
| `CONTEXT.md` | Domain language. |
| `document/PRD.en.md` | v1 scope, tools, evals, acceptance. |
| `docs/adr/*.md` | Binding product decisions. |

## Runtime/Tooling Preferences

| Item | Pin |
|---|---|
| Expo | SDK **54** (`expo ~54.0.36`, lockfile 54.0.37) |
| React Native | `0.81.5` |
| React | `19.1.0` |
| expo-router | `~6.0.24` |
| TypeScript | `~5.9.2` |
| ESLint | 9 + `eslint-config-expo ~10.0.0` |
| Package manager | **pnpm** (no `packageManager` / `engines` field — convention only) |
| Architecture | New Architecture on; Android edge-to-edge |
| Docs | https://docs.expo.dev/versions/v54.0.0/ **only** — do not use unversioned or other-SDK pages |

`pnpm-workspace.yaml` only allowlists `unrs-resolver` builds. This is a **single-package** app, not a multi-package monorepo.

## Testing & QA

**No tests exist.** No Jest/Vitest/Playwright/Detox/Maestro, no `test` script, no coverage config. `pnpm test` will fail.

When adding tests:

- Highest value is **pure rule logic** from CONTEXT.md / ADRs: 7 Sessions, `hardCount ≤ 1`, Rest/Walk gate, pain gate, duration-by-kind, Quality one-line, overwrite this Monday.
- PRD §10 golden fixtures (must pass for v1): `happy-en`, `pain-lutut`, `two-hard-draft`, `no-rest`, `empty-log`, `quality-no-pace`, `mixed-id-en`, `board-has-seven`, `second-build-overwrite`, `sakit-no-dx`.
- Natural stack for Expo 54: `jest-expo` + `@testing-library/react-native`.
- Observability: one trace per Build; each tool = one span.

Until then, gate changes with `pnpm run lint` and `pnpm exec tsc --noEmit`.
