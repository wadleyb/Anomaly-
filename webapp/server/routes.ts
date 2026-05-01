import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import { storage } from "./storage";
import { z } from "zod";

// ---- Daily puzzle math ------------------------------------------------------
// Day 1 = launch date. Same daily for everyone using server clock (UTC).
const LAUNCH_UTC = Date.UTC(2026, 4, 1); // 2026-05-01

export function dayNumber(): number {
  const now = Date.now();
  return Math.floor((now - LAUNCH_UTC) / 86400000) + 1;
}

// ---- Player cookie ----------------------------------------------------------
const COOKIE = "aid";

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function ensurePlayer(req: Request, res: Response): string {
  let id = readCookie(req, COOKIE);
  if (!id) {
    id = randomUUID();
    // 5-year cookie, lax (so it survives shares back to the site).
    res.setHeader(
      "Set-Cookie",
      `${COOKIE}=${id}; Max-Age=${60 * 60 * 24 * 365 * 5}; Path=/; SameSite=Lax; HttpOnly`,
    );
  }
  storage.getOrCreatePlayer(id);
  return id;
}

// ---- Validation -------------------------------------------------------------
const submitSchema = z.object({
  day: z.number().int().min(1),
  results: z.array(z.enum(["🟩", "🟥"])).length(5),
  totalMs: z.number().int().min(0).max(10 * 60 * 1000),
});

// ---- Routes -----------------------------------------------------------------
export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Today's daily — server-side day so it's the same for everyone.
  app.get("/api/daily/today", (req, res) => {
    const playerId = ensurePlayer(req, res);
    const day = dayNumber();
    const player = storage.getOrCreatePlayer(playerId);
    const existing = storage.getDailyPlay(playerId, day);
    const stats = storage.getDayStats(day);
    res.json({
      day,
      played: !!existing,
      result: existing
        ? { results: JSON.parse(existing.results), greens: existing.greens, totalMs: existing.totalMs }
        : null,
      player: {
        streak: player.streak,
        bestStreak: player.bestStreak,
        totalPlayed: player.totalPlayed,
        totalWon: player.totalWon,
      },
      globalPlays: stats?.plays ?? 0,
    });
  });

  // Submit a completed daily.
  app.post("/api/daily/submit", (req, res, next) => {
    try {
      const playerId = ensurePlayer(req, res);
      const parsed = submitSchema.parse(req.body);
      const today = dayNumber();
      if (parsed.day !== today) {
        return res.status(400).json({ error: "Day mismatch — refresh and try again." });
      }
      const existing = storage.getDailyPlay(playerId, today);
      if (existing) {
        return res.status(409).json({ error: "Already played today." });
      }
      const greens = parsed.results.filter((r) => r === "🟩").length;
      storage.recordDailyPlay({
        playerId,
        day: today,
        results: JSON.stringify(parsed.results),
        greens,
        totalMs: parsed.totalMs,
        createdAt: Date.now(),
      });
      const player = storage.getOrCreatePlayer(playerId);
      res.json({
        ok: true,
        player: {
          streak: player.streak,
          bestStreak: player.bestStreak,
          totalPlayed: player.totalPlayed,
          totalWon: player.totalWon,
        },
      });
    } catch (e) {
      next(e);
    }
  });

  // Player history — for the archive page.
  app.get("/api/player/history", (req, res) => {
    const playerId = ensurePlayer(req, res);
    const player = storage.getOrCreatePlayer(playerId);
    const history = storage.getPlayerHistory(playerId);
    res.json({
      player,
      history: history.map((h) => ({
        day: h.day,
        results: JSON.parse(h.results),
        greens: h.greens,
        totalMs: h.totalMs,
      })),
      currentDay: dayNumber(),
    });
  });

  // Lightweight error handler for zod validation
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "Bad request", details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  });

  return httpServer;
}
