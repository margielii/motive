import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Test records only; the MOTIVE application schema is not yet defined.
export const foundationProbe = sqliteTable("foundation_probe", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
  createdAt: integer("created_at").notNull(),
});
