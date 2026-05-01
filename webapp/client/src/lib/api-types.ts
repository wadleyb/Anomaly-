// Shared response types matching server/routes.ts.

export type DailyTodayResponse = {
  day: number;
  played: boolean;
  result: { results: Array<"🟩" | "🟥">; greens: number; totalMs: number } | null;
  player: {
    streak: number;
    bestStreak: number;
    totalPlayed: number;
    totalWon: number;
  };
  globalPlays: number;
};

export type SubmitResponse = {
  ok: true;
  player: {
    streak: number;
    bestStreak: number;
    totalPlayed: number;
    totalWon: number;
  };
};

export type HistoryResponse = {
  player: {
    id: string;
    streak: number;
    bestStreak: number;
    totalPlayed: number;
    totalWon: number;
    lastPlayedDay: number | null;
  };
  history: Array<{
    day: number;
    results: Array<"🟩" | "🟥">;
    greens: number;
    totalMs: number;
  }>;
  currentDay: number;
};
