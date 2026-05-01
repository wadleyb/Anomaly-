import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// A persistent player identified by an opaque id stored in a cookie.
// We avoid localStorage (sandboxed) so streaks survive across sessions
// via an httpOnly cookie set by the server.
export const players = sqliteTable("players", {
  id: text("id").primaryKey(),                       // uuid
  streak: integer("streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  totalPlayed: integer("total_played").notNull().default(0),
  totalWon: integer("total_won").notNull().default(0), // perfect (5/5) days
  lastPlayedDay: integer("last_played_day"),         // day number, e.g. 47
  createdAt: integer("created_at").notNull(),
});
export type Player = typeof players.$inferSelect;

// One row per (player, day) — the player's result for that daily.
export const dailyPlays = sqliteTable("daily_plays", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: text("player_id").notNull(),
  day: integer("day").notNull(),                     // day number
  results: text("results").notNull(),                // JSON: ["🟩","🟥",...]
  greens: integer("greens").notNull(),               // count of correct
  totalMs: integer("total_ms").notNull(),            // total time taken
  createdAt: integer("created_at").notNull(),
});
export const insertDailyPlaySchema = createInsertSchema(dailyPlays).omit({ id: true });
export type InsertDailyPlay = z.infer<typeof insertDailyPlaySchema>;
export type DailyPlay = typeof dailyPlays.$inferSelect;

// Aggregate daily stats — how many people played, distribution of greens.
export const dailyStats = sqliteTable("daily_stats", {
  day: integer("day").primaryKey(),
  plays: integer("plays").notNull().default(0),
  totalGreens: integer("total_greens").notNull().default(0),
});
