import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import type { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import mysql from "mysql2/promise";
import { getDatabaseUrl } from "../lib/env.js";
import * as schema from "./schema/index.js";

export type AppDatabase = MySql2Database<typeof schema>;

let poolInstance: mysql.Pool | null = null;
let dbInstance: AppDatabase | null = null;

/** Lazily create shared mysql2 pool configured for UTC timestamps and utf8mb4. */
export function getPool(): mysql.Pool {
  if (!poolInstance) {
    poolInstance = mysql.createPool({
      uri: getDatabaseUrl(),
      timezone: "Z",
      charset: "utf8mb4",
      decimalNumbers: true,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return poolInstance;
}

/** Return singleton Drizzle MySQL instance. */
export function getDb(): AppDatabase {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema, mode: "default" });
  }
  return dbInstance;
}

/** Close the shared connection pool (for scripts and tests). */
export async function closeDb(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    dbInstance = null;
  }
}

/** Normalize MySQL decimal / numeric driver values to finite JS numbers. */
export function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * MySQL does not support `.returning()`. Insert with an app-generated UUID and select the row back.
 */
export async function insertAndGet<
  TTable extends MySqlTable & { id: MySqlColumn },
>(
  database: AppDatabase,
  table: TTable,
  values: Omit<InferInsertModel<TTable>, "id"> & { id?: string },
): Promise<InferSelectModel<TTable>> {
  const id = values.id ?? crypto.randomUUID();
  const payload = { ...values, id } as InferInsertModel<TTable>;
  await database.insert(table).values(payload);
  const rows = await database.select().from(table).where(eq(table.id, id)).limit(1);
  const created = rows[0];
  if (!created) {
    throw new Error(`Failed to load inserted row (${id})`);
  }
  return created as InferSelectModel<TTable>;
}
