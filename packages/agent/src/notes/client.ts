// Connects the notes MCP server over stdio for the agent (PRD §8: RAG runs
// through MCP, span-provable). Returns an adapter for the Weeksmith ports.
import { McpClient, type McpServer } from "@anvia/mcp";
import { join } from "node:path";
import type { NotesStore } from "../ports.js";

type Server = McpServer;

export interface NotesMcpConnection extends NotesStore {
  close(): Promise<void>;
}

export async function connectNotesMcp(): Promise<NotesMcpConnection> {
  const notesDir = join(import.meta.dirname, "../../notes");
  const client = new McpClient({
    name: "weeksmith-notes-client",
    transport: {
      type: "stdio",
      command: "pnpm",
      args: ["--filter", "@runmax/agent", "notes:dev"],
      env: { ...process.env, NOTES_DIR: notesDir } as Record<string, string>,
    },
    versionNegotiation: { mode: "auto" },
  });
  const store: Server = await client.connect();
  const notes: NotesStore = {
    search: (query) => callTool(store, "searchNotes", { query }, (r) => r.ids as string[]),
    read: (id) => callTool(store, "readNote", { id }, (r) => r.body as string),
  };
  return {
    ...notes,
    async close() {
      await client.close();
    },
  };
}

interface RichToolOutput {
  content: ReadonlyArray<{ readonly type: string; readonly text?: string }>;
}

function isRichToolOutput(value: unknown): value is RichToolOutput {
  if (typeof value !== "object" || value === null) return false;
  return Array.isArray((value as RichToolOutput).content);
}

async function callTool<T>(
  store: Server,
  name: string,
  args: Record<string, unknown>,
  pick: (result: Record<string, unknown>) => T,
): Promise<T> {
  const tool = store.tools.find((t) => t.name === name);
  if (tool === undefined) {
    throw new Error(`notes MCP server has no tool "${name}"`);
  }
  const output = await tool.call(args);
  if (!isRichToolOutput(output)) {
    throw new TypeError(`notes tool "${name}" returned no content`);
  }
  const text = output.content
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
  const result = JSON.parse(text) as Record<string, unknown>;
  return pick(result);
}

