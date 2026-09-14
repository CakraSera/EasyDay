// MCP `notes` server (PRD §8): searchNotes + readNote over builder-written
// markdown in packages/agent/notes/. No copyrighted books, no diagnosis.
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { basename, join } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { z } from "zod";

export function createNotesServer(notesDir: string): McpServer {
  const server = new McpServer({ name: "notes", version: "1.0.0" });

  server.registerTool(
    "searchNotes",
    {
      description: "Search the coach notes by keyword. Returns note ids, most relevant first.",
      inputSchema: z.object({ query: z.string() }),
    },
    async ({ query }) => {
      const ids = await rankNotes(notesDir, query);
      return { content: [{ type: "text", text: JSON.stringify({ ids }) }] };
    },
  );

  server.registerTool(
    "readNote",
    {
      description: "Read one note's full markdown body by id (file name without .md).",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const body = await readFile(join(notesDir, `${basename(id)}.md`), "utf8");
      return { content: [{ type: "text", text: JSON.stringify({ body }) }] };
    },
  );

  return server;
}

/** Title/body keyword scoring — deterministic, dependency-free, good enough for six notes. */
async function rankNotes(notesDir: string, query: string): Promise<string[]> {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const files = (await readdir(notesDir)).filter((f) => f.endsWith(".md"));
  const scored = await Promise.all(
    files.map(async (file) => {
      const body = (await readFile(join(notesDir, file), "utf8")).toLowerCase();
      const score = terms.reduce((sum, term) => sum + (body.includes(term) ? 1 : 0), 0);
      return { id: basename(file, ".md"), score };
    }),
  );
  return scored
    .filter((n) => n.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((n) => n.id);
}

const invokedDirectly = process.argv[1]?.endsWith("server.ts") ?? false;
if (invokedDirectly) {
  const notesDir = process.env.NOTES_DIR ?? join(import.meta.dirname, "../../../notes");
  const server = createNotesServer(notesDir);
  await server.connect(new StdioServerTransport());
}
