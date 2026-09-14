// Prisma config: root .env supplies DATABASE_URL (docker compose db on
// :15433), with a local fallback to the embedded dev cluster on :54329.
// Migrations run through the driver adapter — no engine-level connect.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { defineConfig } from "prisma/config";

const url =
  process.env.DATABASE_URL ??
  "postgresql://easyday:easyday@127.0.0.1:54329/easyday";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
  migrate: {
    adapter: async () => new PrismaPg(url),
  },
});
