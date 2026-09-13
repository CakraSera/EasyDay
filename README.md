# EasyDay

One runner’s **this Week** of running from an optional messy **Log** — shown as a **Board** on mobile-first web. See [CONTEXT.md](CONTEXT.md) for the domain language and [document/PRD.en.md](document/PRD.en.md) for the full PRD.

## Stack

- pnpm workspace — `apps/platform` (FE), `apps/api` (BE), `packages/agent` (AI)
- Vite 8 · React 19 · TanStack Router · Tailwind CSS 4

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Start the Board

   ```bash
   pnpm start
   ```

Open `http://localhost:3000`. Edit `apps/platform/src/routes/index.tsx`.

## Useful scripts

| Script | Purpose |
| --- | --- |
| `pnpm start` / `pnpm web` | Vite Board on port 3000 |
| `pnpm --filter platform typecheck` | Typecheck FE |
| `pnpm --filter api typecheck` | Typecheck BE |
| `pnpm --filter @easyday/agent typecheck` | Typecheck AI |
