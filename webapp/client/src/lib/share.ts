// Build a shareable result card. Wordle-style emoji grid.
export function buildShareText(opts: {
  day: number;
  results: Array<"🟩" | "🟥">;
  totalMs: number;
  url?: string;
}): string {
  const { day, results, totalMs, url } = opts;
  const greens = results.filter((r) => r === "🟩").length;
  const seconds = Math.round(totalMs / 1000);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const grid = results.join("");
  const link = url ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `ANOMALY · Day ${day}\n${greens}/5 · ${time}\n${grid}\n${link}`;
}
