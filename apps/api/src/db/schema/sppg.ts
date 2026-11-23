import type { Level } from "@mbg/shared";
import { boolean, json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { uuidId } from "./helpers.js";

export const sppg = mysqlTable("sppg", {
  id: uuidId(),
  name: varchar("name", { length: 200 }).notNull(),
  region: varchar("region", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schools = mysqlTable("schools", {
  id: uuidId(),
  sppgId: varchar("sppg_id", { length: 36 })
    .references(() => sppg.id)
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  levels: json("levels").$type<Level[]>().notNull(),
  timezone: varchar("timezone", { length: 50 }).notNull().default("Asia/Jakarta"),
  active: boolean("active").default(true).notNull(),
});
