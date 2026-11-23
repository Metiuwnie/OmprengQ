import { SEXES, type Allergen, type MealSlot } from "@mbg/shared";
import { int, json, mysqlEnum, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { numCol, uuidId } from "./helpers.js";

export const akgReference = mysqlTable(
  "akg_reference",
  {
    id: int("id").autoincrement().primaryKey(),
    sex: mysqlEnum("sex", SEXES).notNull(),
    ageMin: int("age_min").notNull(),
    ageMax: int("age_max").notNull(),
    energyKcal: int("energy_kcal").notNull(),
    proteinG: int("protein_g").notNull(),
    fatG: int("fat_g").notNull(),
    carbG: int("carb_g").notNull(),
    fiberG: int("fiber_g").notNull(),
    ironMg: int("iron_mg").notNull(),
  },
  (t) => [uniqueIndex("akg_sex_age").on(t.sex, t.ageMin, t.ageMax)],
);

export const householdFoods = mysqlTable("household_foods", {
  id: uuidId(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull(),
  urtLabel: varchar("urt_label", { length: 100 }).notNull(),
  grams: numCol("grams").notNull(),
  energyKcal: numCol("energy_kcal").notNull(),
  proteinG: numCol("protein_g").notNull(),
  fatG: numCol("fat_g").notNull(),
  carbG: numCol("carb_g").notNull(),
  fiberG: numCol("fiber_g").notNull(),
  ironMg: numCol("iron_mg").notNull(),
  allergens: json("allergens")
    .$type<Allergen[]>()
    .notNull()
    .$defaultFn(() => []),
  mealSlots: json("meal_slots").$type<MealSlot[]>().notNull(),
  priceTier: int("price_tier").default(1).notNull(),
  emoji: varchar("emoji", { length: 16 }),
});
