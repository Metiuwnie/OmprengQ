import { USAGE_EVENT_TYPES } from "@mbg/shared";
import { int, mysqlEnum, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { schools } from "./sppg.js";

/** Daily aggregate anonymous usage counters per school (zero user/profile data). */
export const usageEvents = mysqlTable(
  "usage_events",
  {
    id: int("id").autoincrement().primaryKey(),
    schoolId: varchar("school_id", { length: 36 })
      .references(() => schools.id, { onDelete: "cascade" })
      .notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    eventType: mysqlEnum("event_type", USAGE_EVENT_TYPES).notNull(),
    count: int("count").default(1).notNull(),
  },
  (t) => [uniqueIndex("usage_events_school_date_type").on(t.schoolId, t.date, t.eventType)],
);
