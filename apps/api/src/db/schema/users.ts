import { ROLES } from "@mbg/shared";
import { mysqlEnum, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { uuidId } from "./helpers.js";
import { schools, sppg } from "./sppg.js";

export const users = mysqlTable("users", {
  id: uuidId(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  role: mysqlEnum("role", ROLES).notNull(),
  sppgId: varchar("sppg_id", { length: 36 }).references(() => sppg.id),
  schoolId: varchar("school_id", { length: 36 }).references(() => schools.id),
});
