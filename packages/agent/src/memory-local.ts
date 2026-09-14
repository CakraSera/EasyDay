// Minimal in-memory MemoryStore for the Studio process. Append-only per
// session scope; enough for replay/history inspection without Postgres.
import type { MemoryStore } from "@anvia/core";
import type { Message } from "@anvia/core/completion";

interface StoredConversation {
  messages: Array<{ position: number; runId: string; turn: number; createdAt: string; message: Message }>;
  createdAt: string;
  updatedAt: string;
}

export function createLocalMemoryStore(): MemoryStore {
  const conversations = new Map<string, StoredConversation>();
  const key = (scope: { sessionId: string; userId?: string }) =>
    `${scope.userId ?? "-"}:${scope.sessionId}`;

  return {
    async load({ scope }) {
      const stored = conversations.get(key(scope));
      return stored ? stored.messages.map((m) => m.message) : [];
    },
    async append({ scope, runId, turn, messages }) {
      const k = key(scope);
      const now = new Date().toISOString();
      const stored = conversations.get(k) ?? { messages: [], createdAt: now, updatedAt: now };
      for (const message of messages) {
        stored.messages.push({
          position: stored.messages.length,
          runId,
          turn,
          createdAt: now,
          message,
        });
      }
      stored.updatedAt = now;
      conversations.set(k, stored);
    },
    async clear({ scope }) {
      conversations.delete(key(scope));
    },
    async recordError({ scope, runId, error }) {
      console.error(`[memory:${key(scope)}:${runId}]`, error);
    },
    get inspector() {
      return {
        async listConversations({ limit }: { limit: number }) {
          return [...conversations.entries()].slice(0, limit).map(([k, v]) => ({
            ref: k,
            sessionId: k.split(":")[1] ?? k,
            messageCount: v.messages.length,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
          }));
        },
        async getConversation({ ref }: { ref: string }) {
          const stored = conversations.get(ref);
          if (stored === undefined) return undefined;
          return {
            ref,
            sessionId: ref.split(":")[1] ?? ref,
            messageCount: stored.messages.length,
            createdAt: stored.createdAt,
            updatedAt: stored.updatedAt,
            messages: stored.messages,
          };
        },
      };
    },
  };
}
