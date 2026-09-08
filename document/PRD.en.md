# Easy Plan — PRD v1

**Status:** scope lock for a 14-day student build  
**Date:** 2026-09-06  
**Course:** Devscale Indonesia, AI Product Engineering TypeScript Batch I  
**Stack:** TypeScript fullstack. **Expo 54 web, mobile-first** (phone width) + TypeScript agent server.  
**Persistence:** Goal and Weeks live on the agent server as user **`demo`**. No auth in v1. Rebuild **overwrites this Monday**. Past calendar Weeks (older Mondays) are kept. No snapshots of the same weekStart.  
**Job:** From one race Goal and an optional messy Log, produce **this Week** with ≤1 Hard Session, as a **Board**.

Canonical terms live in [`../CONTEXT.md`](../CONTEXT.md). Use those words in code, evals, and UI copy.

---

## 1. Problem

Runners stack two or three hard days because a chatbot said “add intervals.” Sixteen-week calendars are not used on Sunday night. They need **this week**, easy miles first, one quality session at most, rest or walk included, on a phone-width Board they can actually follow.

This is not another AI chatbot. This is not WhatsApp.

---

## 2. User

One runner (the builder). Logs may be Indonesian, English, or mixed.

v1 is **not** a club captain, coach roster, or multi-athlete product.

**Surface:** mobile-first web. Demo in a phone-width browser. Not a store app.

---

## 3. In scope

- PRD before code (this file + Indonesian twin).
- Home = Board. Chat is an optional **Why?** drawer only (read-only explain).
- One agent (`Weeksmith`) + one workflow (`BuildThisWeek`).
- 6 verb-named tools. No `doAnything`.
- MCP `notes` + RAG over **short notes the builder wrote** (not copyrighted books).
- Evals + traces (one trace per Build; each tool is a span).
- Goal: distance + race date + optional seed time.
- This Week only (**Monday–Sunday**, not a rolling 7 days). No 16-week calendar UI.
- Goal + Weeks persist as user `demo` on the agent server. No login. Current Monday overwrites; older Mondays kept.
- Most Sessions Easy (conversation pace).
- Max 1 Hard Session per Week.
- ≥1 Rest or Walk.
- Pain in the Log → no Quality, no running intervals. No medical diagnosis.
- Seed time → Easy-pace hint only, never interval splits.
- If race date falls in this Week: the one Hard Session is Race (or an Easy shakeout). No intervals.
- Expo 54 **web**, mobile-first layout.
- No Strava / Garmin required.
- **No WhatsApp** (no copy, no send, no template).

---

## 4. Out of scope (will not build in 14 days)

1. Chat as home, or any planner thread
2. 16-week calendar UI
3. Strava, Garmin, Apple Health
4. WhatsApp copy, templates, or send
5. Auth, teams, club roster
6. Photo OCR / voice Log
7. Mid-week rebuild from new runs
8. Interval / workout library
9. Race predictor, VDOT, splits
10. HR zones, TSS, charts
11. Diagnosis, physio, body map
12. Supplements or shop
13. Push notifications / calendar sync / native store builds
14. Full-app i18n (bilingual **Logs** are enough; UI chrome is English)
15. Payments, social feed, coach marketplace

---

## 5. Domain objects

| Object | Fields | Rules |
|---|---|---|
| **Goal** | `distance`, `raceDate`, `seedTime?` | One Goal. Race date in the past is rejected. |
| **Week** | `weekStart` (Monday), `sessions[7]`, `flags[]`, `sourceLog?` | Exactly 7 Sessions. No share-text field. |
| **Session** | `date`, `kind`, `durationMinutes`, `distanceKm?`, `hard`, `note` | `kind`: `easy` \| `quality` \| `rest` \| `walk` \| `race` |

**Flags (on Week):** `pain` · `raceThisWeek` · `emptyLog`

**Hard:** `quality` and `race` are Hard. `easy`, `rest`, `walk` are not. `hardCount` ≤ 1.

---

## 6. UI (home is not chat)

Mobile-first web. Phone width. One column.

1. **Board** (home): 7 Session cards for this Week, **always Mon–Sun** (mid-week Build still fills Monday and Tuesday). Empty state until the first Build. **This is the artifact.**
2. **Goal** fields: distance, race date, optional seed time.
3. **Log** textarea (optional paste).
4. Primary CTA: **Build this week**.
5. Workflow chips (not bubbles): `parseLog` → `retrieveNotes` → `draftWeek` → `checkWeek` → `saveWeek`.
6. Banner: pain / race-this-week / ok.
7. Tap a card → edit **Kind**, minutes, optional km, and note. Date is not editable. `hard` follows Kind. Illegal edits (**second Quality**, **zero Rest/Walk**, Quality while `pain`) are **blocked**: card does not change, banner explains.
8. Duration: Rest = **0** minutes (cleared if Kind becomes Rest). Walk may have minutes. Easy / Quality / Race minutes **must be > 0** (0 is blocked).
9. **Past weeks**: a list under the Board (older Mondays). Tap to view that Week **read-only**. Not a second home.
10. Optional **Why?** drawer: cites RAG notes. Close returns to the Board. The drawer must not be the planner.

No Copy / Share / WhatsApp button in v1.

Failure = banner on the Board, not a conversation.

---

## 7. Agent, workflow, tools

- **Agent:** `Weeksmith`
- **Workflow:** `BuildThisWeek` (one-button job)

| Tool | Does |
|---|---|
| `loadGoal` | Read the saved Goal. Fail if missing or race date in the past. |
| `parseLog` | Parse optional ID/EN/mixed Log into cues: pain, recent Hard, rough volume. Empty Log is valid. |
| `retrieveNotes` | RAG via MCP `notes` (`searchNotes`, `readNote`). |
| `draftWeek` | Write 7 Sessions for this Monday–Sunday. |
| `checkWeek` | Enforce product rules. On fail, repair or reject — never ship an illegal Week. |
| `saveWeek` | Persist the Week as the single-user server record. |

`checkWeek` **fails** if any of:

- `hardCount > 1`
- no Rest and no Walk
- `pain` and any Quality / running intervals
- race-this-week and any interval Session
- Session count ≠ 7
- a diagnosis sentence (“you have X”)

---

## 8. MCP and RAG

**MCP server:** `notes`

- `searchNotes(query)`
- `readNote(id)`

**RAG corpus** (builder-written markdown only):

- `easy-pace.md` — conversation pace; most minutes Easy
- `one-hard-day.md` — max 1 Quality per Week
- `rest-or-walk.md` — ≥1 Rest or Walk
- `pain-gate.md` — pain/injury cues → no intervals; not a diagnosis
- `race-this-week.md` — race in this Week is the Hard day
- `seed-time-is-easy-cap.md` — seed ≠ workout target
- `log-cues-id-en.md` — ID/EN pain and effort cues

No copyrighted books. No medical sources posed as diagnosis.

---

## 9. Planning rules (product, not vibes)

- Plan **this calendar Week** (Mon–Sun), not a rolling 7 days, not a season.
- Most Sessions Easy.
- Duration is **minutes-primary**. Optional km on the card. Rest/Walk may be 0 minutes.
- Quality is `kind=quality` plus an **agent-written one-line note** (RAG-constrained, e.g. “20 min tempo”). No workout picker.
- Default when no Pain and race is not this Week: **always exactly 1 Quality**. Do not drop Quality because the Log looks hard.
- Board chrome is **English**. Logs stay ID/EN/mixed.
- Pain → 0 Quality, 0 intervals; Easy / Walk / Rest only.
- Race date ∈ this Week → at most one Hard, and it is `race` (or Easy shakeout if Pain).
- Seed time may appear as an Easy-pace hint, never as `5×1000 @ …`.
- Never diagnose. Never prescribe meds or supplements.

---

## 10. Evals and observability

**Observability:** one trace per Build this week. Each tool = one span. Demo shows the trace (phone-width web or a second narrow panel — not a chat).

**Golden fixtures (must pass):**

1. `happy-en` — 10K, ~8 weeks out, English Log, no pain → 1 Quality, ≥1 Rest/Walk, rest Easy.
2. `pain-lutut` — `Rabu lutut agak nyeri, jalan aja` → `hardCount=0`, no Quality, Walk or Rest present, pain banner.
3. `two-hard-draft` — draft tries two Quality days → `checkWeek` rejects; shipped Week ≤1 Hard.
4. `no-rest` — 7 Easy/Quality, 0 Rest/Walk → reject until ≥1 Rest or Walk.
5. `empty-log` — Goal only → conservative Week, ≤1 Quality, ≥1 Rest/Walk, 7 Sessions.
6. `race-in-3-days` — race date this Week, no pain → one `race` (or shakeout), 0 intervals.
7. `mixed-id-en` — mixed Log still yields 7 Sessions.
8. `board-has-seven` — saved Week has exactly 7 Sessions, kinds in Mon–Sun order.
9. `seed-not-workout` — seed `55:00` may hint Easy pace; no interval splits.
10. `sakit-no-dx` — `dada pegal abis lari` → no Quality; output contains no diagnosis sentence.

---

## 11. Acceptance

v1 is done when all of these are true:

- [ ] Home is a Board on **mobile-first web**, not a chat, not WhatsApp.
- [ ] One Goal in, this Week out, ≤1 Hard, ≥1 Rest or Walk.
- [ ] Pain Log → no Quality / intervals, with a banner — and no diagnosis.
- [ ] Board shows 7 Sessions for Mon–Sun.
- [ ] `BuildThisWeek` runs 6 named tools under one trace.
- [ ] MCP `notes` + RAG notes are actually retrieved (span evidence).
- [ ] 10 golden fixtures pass.
- [ ] 60-second demo below can be performed in a phone-width browser without a planner chat.

---

## 12. 60-second demo

0:00 Phone-width browser. Home = empty Board. Not a chat.  
0:05 Goal: **10K · 8 Jun · seed 55:00**.  
0:12 Paste Log: `Senin 8k pelan. Rabu lutut agak nyeri jadi jalan. Jumat 5k.`  
0:18 Tap **Build this week**. Chips fire.  
0:28 Board: Easy / Walk / Easy / Rest / Easy / Easy / Easy. **No Quality.** Banner: pain → no Hard.  
0:40 Scroll all 7 cards. Minutes (+ km if present) visible.  
0:48 **Why?** drawer cites `pain-gate.md`. Close.  
0:55 Open the trace: 6 tool spans.  
1:00 Stop. Do not open WhatsApp.

---

## 13. Course checklist

| Requirement | Where |
|---|---|
| PRD before code | `document/PRD.en.md`, `document/PRD.id.md` |
| Agents with verb tools (4–6) | `Weeksmith` + 6 tools above |
| MCP and RAG | MCP `notes` + `/notes` markdown |
| Evals and traces | §10 |
| ≥1 agentic workflow + 1 AI agent | `BuildThisWeek` + `Weeksmith` |
| Home is not chat | Board; **Why?** is optional |

---

## 14. Later (not v1)

16-week calendar · Strava/Garmin · WhatsApp copy/send · native store app · multi-athlete · mid-week adapt · workout library · race predictor · OCR · HR zones · diagnosis/physio/shop.

Each of those reuses `Goal` / `Week` / `Session` only. Do not invent new v1 objects for them.
