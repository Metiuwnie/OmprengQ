import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import app from "./app.js";
import { ensureEnvLoaded } from "./lib/env.js";
import { securityHeaders } from "./middleware/security.js";

ensureEnvLoaded();

function resolveWebDistDir(): string | null {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(currentDir, "../../web/dist"),
    resolve(process.cwd(), "apps/web/dist"),
    resolve(process.cwd(), "../web/dist"),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, "index.html"))) {
      return dir;
    }
  }
  return null;
}

const server = new Hono();
server.route("/", app);

const webDistDir = resolveWebDistDir();
if (webDistDir) {
  const staticRoot = relative(process.cwd(), webDistDir) || ".";
  const indexHtml = readFileSync(join(webDistDir, "index.html"), "utf8");

  server.use("/*", securityHeaders);
  server.use("/*", serveStatic({ root: staticRoot }));
  server.get("*", (c) => {
    if (c.req.path.startsWith("/api")) {
      return c.notFound();
    }
    return c.html(indexHtml);
  });
}

const port = Number(process.env.PORT ?? 3000);

serve(
  {
    fetch: server.fetch,
    port,
  },
  (info) => {
    console.log(`OmprengQ server listening on http://localhost:${info.port}`);
  },
);
