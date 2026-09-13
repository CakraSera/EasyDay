// RunMax agent server (port 8000, same as the reference repo). Home is the
// Board; failures come back as JSON the Board renders as a banner.
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { buildRouter } from "./modules/build/router.js";
import { weekRouter } from "./modules/week/router.js";
import { langfuse } from "@runmax/agent";

const app = new Hono()
  .use(cors())
  .route("/api/build", buildRouter)
  .route("/api/week", weekRouter);

serve(
  {
    fetch: app.fetch,
    port: 8000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

const shutdown = async () => {
  await langfuse.flush();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
