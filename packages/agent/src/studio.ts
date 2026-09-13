// Anvia Studio: local browser UI attached to the live Weeksmith agent.
// Inspect tools/traces/sessions and drive BuildThisWeek runs without the
// Board. Same stores and gateway config as runner-dev; one process.
import { Studio, createInMemoryStudioStore } from "@anvia/studio";
import { createWeeksmith } from "./agent.js";
import { createLocalMemoryStore } from "./memory-local.js";
import { connectNotesMcp } from "./notes/client.js";
import { fileWeekStore } from "./store-file.js";

const notes = await connectNotesMcp();
const weeks = fileWeekStore();
const agent = createWeeksmith({
  stores: { notes, weeks },
  memory: { store: createLocalMemoryStore() },
});

const store = createInMemoryStudioStore();
const studio = new Studio([agent], {
  ui: true,
  stores: { sessions: store, traces: store },
  quickPrompts: {
    weeksmith: [
      "Build this week. The Log is empty.",
      "Build this week from this Log:\n\nRabu lutut agak nyeri, jalan aja",
      "Build this week from this Log:\n\nLast week 20km total, felt strong.",
    ],
  },
});

studio.start({ port: 4021, hostname: "127.0.0.1", log: true });

const shutdown = async () => {
  await studio.shutdown({ timeoutMs: 3000 });
  await notes.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
