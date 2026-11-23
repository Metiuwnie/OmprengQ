import type { Allergen } from "@mbg/shared";
import { boolean, json, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { numCol, uuidId } from "./helpers.js";

export const foods = mysqlTable("foods", {
  id: uuidId(),
  code: varchar("code", { length: 50 }).unique(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  energyKcal: numCol("energy_kcal").notNull(),
  proteinG: numCol("protein_g").notNull(),
  fatG: numCol("fat_g").notNull(),
  carbG: numCol("carb_g").notNull(),
  fiberG: numCol("fiber_g").notNull(),
  ironMg: numCol("iron_mg").notNull(),
  ediblePct: numCol("edible_pct").default(100).notNull(),
  allergens: json("allergens")
    .$type<Allergen[]>()
    .notNull()
    .$defaultFn(() => []),
  isCustom: boolean("is_custom").default(false).notNull(),
});
