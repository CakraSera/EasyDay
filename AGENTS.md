# Repository Guidelines

`CLAUDE.md` is `@AGENTS.md` — this file is the single assistant brief.

## Project Overview

**RunMax** (repo still named EasyDay) is a runner’s **this Week** of running from an optional messy **Log**, shown as a **Board** on mobile-first web. **VO2 max** is why-copy only. Not a 16-week calendar, not a chatbot, not a clinic, not WhatsApp, not a race Goal.

Canonical terms live in [`CONTEXT.md`](CONTEXT.md). Use those words in code, evals, and UI copy. Honor each term’s **Avoid** list (no “plan”, “workout”, “calendar”, “chatbot”, “generate”, …).

v1 scope is locked in [`document/PRD.en.md`](document/PRD.en.md) (Indonesian twin: [`document/PRD.id.md`](document/PRD.id.md); object names stay English). Decisions: [`docs/adr/`](docs/adr/).

## Architecture & Data Flow

**Intended (PRD §7):** the chat agent (`/api/chat`, streaming) is live in `apps/api`; the Week/Board workflow is still FE mock only:

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

pnpm workspace:

```
apps/platform   FE — Vite + TanStack Router Board
apps/api        BE — structure only
packages/agent  AI — structure only (`@easyday/agent`)
```

Board lives at [`apps/platform/src/routes/index.tsx`](apps/platform/src/routes/index.tsx). Mock Weeksmith is [`apps/platform/src/lib/weeksmith.ts`](apps/platform/src/lib/weeksmith.ts). Persistence is an in-memory module in `apps/platform/src/lib/store.ts`.

Load-bearing product rules (enforce in `checkWeek` and at card-tap; never render an illegal Week):

- Week = exactly 7 Sessions, Monday–Sunday, keyed by `weekStart` ([ADR 0001](docs/adr/0001-this-week-is-monday-sunday.md)).
- ≤1 Hard Session (`quality` is Hard; `easy` | `rest` | `walk` are not). No `race` Kind ([ADR 0010](docs/adr/0010-week-and-log-not-goal.md)).
- ≥1 Rest or Walk.
- Pain in Log → no Quality, no running intervals, no diagnosis.
- Quality note is minutes + ordinary language; paces / set×distance fail `checkWeek` ([ADR 0014](docs/adr/0014-quality-is-one-line.md)).
- Rest duration = 0 min; Walk may have minutes; Easy/Quality must be > 0 ([ADR 0012](docs/adr/0012-duration-without-race.md)).
- Illegal Kind edits blocked at tap with a banner ([ADR 0007](docs/adr/0007-checkweek-blocks-illegal-edits.md)).
- No past Weeks list ([ADR 0011](docs/adr/0011-no-past-weeks.md)).

v1 surface is **web, phone width** ([ADR 0004](docs/adr/0004-web-mobile-first.md)). No store builds, no WhatsApp ([ADR 0003](docs/adr/0003-board-only-no-whatsapp.md)).

## Key Directories

| Path | Role |
|---|---|
| `apps/platform/` | **FE** — Vite + TanStack Router Board (`name: platform`). |
| `apps/platform/src/routes/` | File routes. Board is `/`. |
| `apps/platform/src/components/` | Board chrome. |
| `apps/platform/src/lib/` | Domain, mock Weeksmith, store, theme. |
| `apps/api/` | **BE** — live server package (`name: api`): Hono + Prisma chat service. Weeksmith workflow not yet wired. |
| `packages/agent/` | **AI** — Weeksmith package (`name: @easyday/agent`). Structure only. |
| `document/` | Bilingual PRD. Update **both** `PRD.en.md` and `PRD.id.md`. |
| `docs/adr/` | Short title+rationale ADRs `0001`–`0014`. New architecture → next `00NN-kebab.md`. |
| `apps/api/src/` | Live agent server: Hono (`server.ts`), Weeksmith chat (`agent.ts`), Prisma store (`store.ts`, `db.ts`). |
| `apps/api/prisma/` | Schema + migrations for the server's PostgreSQL store. |
| `apps/api/scripts/` | `dev-db.ts` (embedded Postgres) and `smoke.ts` (route contract checks). |

`app-example/` is leftover create-expo-app starter. Gitignored. Do not import from it.

## Development Commands

Package manager is **pnpm**. Never npm/yarn/bun. Install from the **repo root**.

```bash
pnpm install
pnpm start                 # Vite on http://localhost:3000
pnpm web                   # same
pnpm typecheck             # all workspace packages
pnpm --filter api dev      # agent server: tsx watch src/server.ts
pnpm --filter api db:up    # embedded dev PostgreSQL (port 54329)
pnpm --filter api db:migrate
pnpm --filter api smoke    # server route contract checks
```

No `test` script exists.

## Code Conventions & Common Patterns

- **Language:** TypeScript `strict`. Default-export named function components. Double quotes.
- **Routing:** TanStack Router file routes under `apps/platform/src/routes/`. `routeTree.gen.ts` is generated — do not hand-edit after `pnpm --filter platform generate-routes`.
- **Imports:** `@/foo` maps to `apps/platform/src/` (`apps/platform/tsconfig.json` `paths`).
- **Styling:** Tailwind CSS 4. Phone-width, one column (`max-w-[480px]`). UI chrome is English; Logs may be ID/EN/mixed.
- **Domain naming in identifiers and copy:** `Week`, `Session`, `kind`, `hard`, `Log`, `Pain`, `Board`, `Weeksmith`, `BuildThisWeek`. Kind values: `easy` \| `quality` \| `rest` \| `walk`. No `Goal`, no `race`.
- **State / DI:** Week + optional Log belong on the agent server (`demo`), not device-only storage ([ADR 0010](docs/adr/0010-week-and-log-not-goal.md)). Persistence is live in `apps/api` (Prisma/PostgreSQL); the Board still talks to the in-memory mock store until wired to the server.
- **Errors:** Board banner, not a conversation. `checkWeek` fails closed (never ship `hardCount > 1`, 0 Rest/Walk, pain+Quality, ≠7 Sessions, a pace in the Quality note, or a diagnosis sentence).
- **Async:** BuildThisWeek tools should be verb-named functions, one span each, one trace per Build.

## Important Files

| File | Why |
|---|---|
| `apps/platform/src/routes/__root.tsx` | Root layout / header. |
| `apps/platform/src/routes/index.tsx` | Home — Board. |
| `apps/platform/src/lib/domain.ts` | `checkWeek` and Week/Session types. |
| `apps/platform/src/lib/weeksmith.ts` | Mock BuildThisWeek workflow. |
| `apps/api/src/server.ts` | Hono server: `/health` + `/api/chat`. |
| `apps/api/prisma/schema.prisma` | Server persistence schema. |
| `apps/api/scripts/smoke.ts` | Route contract checks (413/400/200). |
| `package.json` | Workspace root `name: easyday`. Scripts filter to `platform`. |
| `apps/platform/package.json` | Vite app `name: platform`. |
| `CONTEXT.md` | Domain language. |
| `document/PRD.en.md` | v1 scope, tools, evals, acceptance. |
| `docs/adr/*.md` | Binding product decisions. |

## Runtime/Tooling Preferences

| Item | Pin |
|---|---|
| Frontend | Vite 8 + TanStack Router + React 19 + Tailwind CSS 4 |
| TypeScript | `~5.9.2` |
| Package manager | **pnpm** |
| Server runtime | Node ≥ 22.18, Hono + @hono/node-server, Prisma 7 + @prisma/adapter-pg |
| Docs (TanStack Router) | https://tanstack.com/router/latest |

`pnpm-workspace.yaml` members: `apps/**`, `packages/**`. FE `apps/platform`, BE `apps/api`, AI `packages/agent`. `allowBuilds` additionally allowlists `@embedded-postgres/linux-x64`, `@prisma/engines`, and `prisma` postinstall scripts.

## Testing & QA

**No tests exist.** No Jest/Vitest/Playwright/Detox/Maestro, no `test` script, no coverage config. `pnpm test` will fail.

When adding tests:

- Highest value is **pure rule logic** from CONTEXT.md / ADRs: 7 Sessions, `hardCount ≤ 1`, Rest/Walk gate, pain gate, duration-by-kind, Quality one-line, overwrite this Monday.
- PRD §10 golden fixtures (must pass for v1): `happy-en`, `pain-lutut`, `two-hard-draft`, `no-rest`, `empty-log`, `quality-no-pace`, `mixed-id-en`, `board-has-seven`, `second-build-overwrite`, `sakit-no-dx`.
- Observability: one trace per Build; each tool = one span.

Until then, gate changes with `pnpm --filter platform typecheck`.
