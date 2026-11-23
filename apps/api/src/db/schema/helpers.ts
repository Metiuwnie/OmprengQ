import { decimal, varchar } from "drizzle-orm/mysql-core";

export const uuidId = () =>
  varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const numCol = (name: string, scale = 2) =>
  decimal(name, { precision: 9, scale, mode: "number" });
