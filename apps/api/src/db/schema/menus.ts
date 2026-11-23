import {
  LEVELS,
  MENU_STATUSES,
  type Allergen,
  type NutrientTotals,
} from "@mbg/shared";
import {
  date,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { foods } from "./foods.js";
import { numCol, uuidId } from "./helpers.js";
import { sppg } from "./sppg.js";

export const menus = mysqlTable(
  "menus",
  {
    id: uuidId(),
    sppgId: varchar("sppg_id", { length: 36 })
      .references(() => sppg.id)
      .notNull(),
    date: date("date", { mode: "string" }).notNull(),
    name: varchar("name", { length: 300 }).notNull(),
    description: text("description"),
    photoUrl: varchar("photo_url", { length: 500 }),
    funFact: text("fun_fact"),
    status: mysqlEnum("status", MENU_STATUSES).notNull().default("draft"),
  },
  (t) => [uniqueIndex("menu_sppg_date").on(t.sppgId, t.date)],
);

export const menuPortions = mysqlTable(
  "menu_portions",
  {
    id: uuidId(),
    menuId: varchar("menu_id", { length: 36 })
      .references(() => menus.id, { onDelete: "cascade" })
      .notNull(),
    level: mysqlEnum("level", LEVELS).notNull(),
    totals: json("totals").$type<NutrientTotals>().notNull(),
    allergens: json("allergens")
      .$type<Allergen[]>()
      .notNull()
      .$defaultFn(() => []),
  },
  (t) => [uniqueIndex("portion_menu_level").on(t.menuId, t.level)],
);

export const menuItems = mysqlTable("menu_items", {
  id: uuidId(),
  portionId: varchar("portion_id", { length: 36 })
    .references(() => menuPortions.id, { onDelete: "cascade" })
    .notNull(),
  foodId: varchar("food_id", { length: 36 })
    .references(() => foods.id)
    .notNull(),
  grams: numCol("grams").notNull(),
  label: varchar("label", { length: 200 }),
  visualUnit: varchar("visual_unit", { length: 100 }),
  benefit: varchar("benefit", { length: 300 }),
});
