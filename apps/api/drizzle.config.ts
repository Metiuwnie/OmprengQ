import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

loadEnv({ path: resolve(process.cwd(), "../../.env") });

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://omprengq:omprengq@localhost:3306/omprengq",
  },
});
