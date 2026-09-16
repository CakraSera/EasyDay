// In-memory LogStore for Studio and evals. File-backed one lives beside it
// for the dev runner; the API swaps in persistence later.
import type { LogStore } from "./ports.js";

export function memoryLogStore(initial = ""): LogStore {
  let current = initial;
  return {
    async save(log: string): Promise<void> {
      current = log;
    },
    async load(): Promise<string> {
      return current;
    },
  };
}
