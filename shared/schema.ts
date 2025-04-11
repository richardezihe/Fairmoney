import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Telegram Users
export const telegramUsers = pgTable("telegram_users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  username: text("username"),
  balance: integer("balance").default(0).notNull(),
  referrerId: text("referrer_id"),
  referralCount: integer("referral_count").default(0).notNull(),
  hasJoinedGroups: boolean("has_joined_groups").default(false).notNull(),
  lastBonusClaim: timestamp("last_bonus_claim"),
  bankAccountNumber: text("bank_account_number"),
  bankName: text("bank_name"),
  bankAccountName: text("bank_account_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTelegramUserSchema = createInsertSchema(telegramUsers).pick({
  telegramId: true,
  firstName: true,
  lastName: true,
  username: true,
  balance: true,
  referrerId: true,
  referralCount: true,
  hasJoinedGroups: true,
  lastBonusClaim: true,
  bankAccountNumber: true,
  bankName: true,
  bankAccountName: true,
});

export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
export type TelegramUser = typeof telegramUsers.$inferSelect;

// Withdrawal Requests
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  telegramUserId: text("telegram_user_id").notNull(),
  amount: integer("amount").notNull(),
  bankName: text("bank_name").notNull(),
  bankAccountNumber: text("bank_account_number").notNull(),
  bankAccountName: text("bank_account_name").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).pick({
  telegramUserId: true,
  amount: true,
  bankName: true,
  bankAccountNumber: true,
  bankAccountName: true,
  status: true,
});

export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

// Sessions
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
