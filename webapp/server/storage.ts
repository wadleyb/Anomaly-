import { players, dailyPlays, dailyStats } from "@shared/schema";
import type { Player, DailyPlay, InsertDailyPlay } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Bootstrap tables (Drizzle isn't run with migrations in this template; we
// create tables idempotently so the deploy "just works").
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    total_played INTEGER NOT NULL DEFAULT 0,
    total_won INTEGER NOT NULL DEFAULT 0,
    last_played_day INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS daily_plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    day INTEGER NOT NULL,
    results TEXT NOT NULL,
    greens INTEGER NOT NULL,
    total_ms INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_plays_unique ON daily_plays(player_id, day);
  CREATE TABLE IF NOT EXISTS daily_stats (
    day INTEGER PRIMARY KEY,
    plays INTEGER NOT NULL DEFAULT 0,
    total_greens INTEGER NOT NULL DEFAULT 0
  );
`);

export const db = drizzle(sqlite);

export const storage = {
  getOrCreatePlayer(id: string): Player {
    const existing = db.select().from(players).where(eq(players.id, id)).get() as Player | undefined;
    if (existing) return existing;
    const created: Player = {
      id,
      streak: 0,
      bestStreak: 0,
      totalPlayed: 0,
      totalWon: 0,
      lastPlayedDay: null,
      createdAt: Date.now(),
    };
    db.insert(players).values(created).run();
    return created;
  },

  getDailyPlay(playerId: string, day: number): DailyPlay | undefined {
    return db.select().from(dailyPlays)
      .where(and(eq(dailyPlays.playerId, playerId), eq(dailyPlays.day, day)))
      .get() as DailyPlay | undefined;
  },

  recordDailyPlay(input: InsertDailyPlay): DailyPlay {
    const inserted = db.insert(dailyPlays).values(input).returning().get() as DailyPlay;

    // Update player streak / totals atomically.
    const player = this.getOrCreatePlayer(input.playerId);
    const wasYesterday = player.lastPlayedDay === input.day - 1;
    const sameDay = player.lastPlayedDay === input.day;
    const won = input.greens >= 1; // any green keeps the streak alive (5/5 = perfect win)
    const perfect = input.greens >= 5;
    let newStreak = player.streak;
    if (!sameDay) {
      newStreak = won ? (wasYesterday ? player.streak + 1 : 1) : 0;
    }
    db.update(players).set({
      streak: newStreak,
      bestStreak: Math.max(player.bestStreak, newStreak),
      totalPlayed: player.totalPlayed + (sameDay ? 0 : 1),
      totalWon: player.totalWon + (sameDay ? 0 : (perfect ? 1 : 0)),
      lastPlayedDay: input.day,
    }).where(eq(players.id, input.playerId)).run();

    // Aggregate stats
    const existing = db.select().from(dailyStats).where(eq(dailyStats.day, input.day)).get() as
      | { day: number; plays: number; totalGreens: number } | undefined;
    if (existing) {
      db.update(dailyStats).set({
        plays: existing.plays + 1,
        totalGreens: existing.totalGreens + input.greens,
      }).where(eq(dailyStats.day, input.day)).run();
    } else {
      db.insert(dailyStats).values({ day: input.day, plays: 1, totalGreens: input.greens }).run();
    }

    return inserted;
  },

  getPlayerHistory(playerId: string, limit = 30): DailyPlay[] {
    return db.select().from(dailyPlays)
      .where(eq(dailyPlays.playerId, playerId))
      .orderBy(desc(dailyPlays.day))
      .limit(limit)
      .all() as DailyPlay[];
  },

  getDayStats(day: number) {
    return db.select().from(dailyStats).where(eq(dailyStats.day, day)).get();
  },
};
