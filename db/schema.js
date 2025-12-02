import { pgTable, varchar, integer, timestamp, text, serial, numeric, unique} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 225 }).notNull().unique(),
  password: varchar("password", { length: 225 }).notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  nominal: numeric("nominal", { precision: 10, scale: 2 }).notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  status: varchar("status", { length: 225, enum: ["income", "outcome"] }).notNull(),
  description: text("description")
});
