# Easy Plan

One runner’s **this Week** of running, produced from one race Goal and an optional messy log. Shown as a Board on mobile-first web. Not a 16-week calendar, not a chatbot, not a clinic, not WhatsApp.

## Language

**Goal**:
The runner’s next race: distance, race date, and optional seed time.
_Avoid_: target, objective, plan, program

**Week**:
Exactly seven Sessions for one calendar week (Monday–Sunday), plus flags, keyed by `weekStart`. Rebuild overwrites **this** Monday. Older Mondays remain as past Weeks and are read-only. v1 never stores a season, a 16-week block, or snapshots of the same Monday.
_Avoid_: plan, calendar, block, mesocycle, schedule, WhatsApp text, WeekVersion, undo log

**Session**:
One day’s running assignment: a date, a kind, a duration, whether it is hard, and a short note.
_Avoid_: workout, activity, run (as the object), training unit

**Kind**:
The type of a Session: `easy`, `quality`, `rest`, `walk`, or `race`.
_Avoid_: zone, intensity name, workout type

**Easy**:
A Session at conversation pace. Most Sessions in a Week are Easy.
_Avoid_: recovery run, zone 2 (as the object)

**Quality**:
The at-most-one harder Session in a Week. A one-line note, not a workout library.
_Avoid_: speedwork, intervals (as the Kind), workout

**Rest**:
A Session with no running.
_Avoid_: off, zero, full rest day (as a second object)

**Walk**:
A Session that is walking, not running. Counts toward the “at least one Rest or Walk” rule.
_Avoid_: active recovery (as the object)

**Race**:
A Session that is the Goal race when the race date falls inside this Week. It is the one hard Session that week; never intervals.
_Avoid_: event, match, competition

**Hard**:
A boolean on a Session. At most one Session in a Week may be Hard. Quality and Race are Hard. Easy, Rest, and Walk are not.
_Avoid_: intense, key session, workout

**Log**:
Optional messy text the runner pastes (Indonesian, English, or mixed) about recent training and how the body felt.
_Avoid_: journal, diary, history, Strava, activity feed

**Pain**:
A Week flag set when the Log contains injury or pain cues. Pain means no Quality and no running intervals. It is not a diagnosis.
_Avoid_: injury (as a medical object), diagnosis, condition

**Board**:
The home screen and the v1 artifact: seven Session cards for this Week, on mobile-first web. Not a chat thread and not a share-to-chat message.
_Avoid_: chat, inbox, feed, calendar UI, WhatsApp, copy block

**Build this week**:
The one-button action that runs the BuildThisWeek workflow and writes the Week.
_Avoid_: generate, ask the AI, chat, plan my week (as a prompt)

**Weeksmith**:
The single AI agent that drafts and checks the Week.
_Avoid_: chatbot, copilot, assistant (as the product)

**BuildThisWeek**:
The agentic workflow: load Goal, parse Log, retrieve notes, draft Week, check Week, save Week.
_Avoid_: SundayRoll (alias only), conversation, chain, formatWhatsApp
