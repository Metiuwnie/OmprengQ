import { serve } from "@hono/node-server";
import app from "./app.js";
import { ensureEnvLoaded } from "./lib/env.js";

ensureEnvLoaded();

const port = Number(process.env.PORT ?? 3000);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`OmprengQ API listening on http://localhost:${info.port}`);
  },
);
