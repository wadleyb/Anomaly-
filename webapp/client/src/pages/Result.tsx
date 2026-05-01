import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { buildShareText } from "@/lib/share";
import type { DailyTodayResponse } from "@/lib/api-types";

export default function Result() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<DailyTodayResponse>({
    queryKey: ["/api/daily/today"],
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }
  // If they haven't played yet, send them to the game.
  if (!data.played) {
    setLocation("/play");
    return null;
  }

  const { day, result, player } = data;
  if (!result) return null;

  const greens = result.greens;
  const seconds = Math.round(result.totalMs / 1000);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const shareText = buildShareText({
    day,
    results: result.results,
    totalMs: result.totalMs,
  });

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: "Copied", description: "Result card on your clipboard." });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Couldn't copy", description: "Long-press the card to select." });
    }
  }

  const headline =
    greens === 5
      ? "Perfect."
      : greens >= 3
      ? "Nice work."
      : greens >= 1
      ? "Got some."
      : "Brutal day.";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-xl px-6 pt-10 pb-16">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="text-base font-bold tracking-tight">ANOMALY</span>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            data-testid="link-home"
          >
            Home
          </Link>
        </div>

        {/* Result */}
        <div className="mt-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Day #{day} · complete
          </p>
          <h1 className="mt-3 text-xl font-black tracking-tight" data-testid="text-headline">
            {headline}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {greens}/5 in {time}
          </p>
        </div>

        {/* Share card */}
        <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-card-border bg-card p-6 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            ANOMALY · Day {day}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {greens}/5 · {time}
          </div>
          <div
            className="mt-4 text-3xl tracking-[0.15em] leading-none"
            data-testid="text-result-grid"
          >
            {result.results.join("")}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            🔥 streak · {player.streak}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="h-14 w-64 text-base font-bold tracking-wide"
            onClick={copyShare}
            data-testid="button-copy"
          >
            {copied ? "✓ COPIED" : "📋 COPY RESULT"}
          </Button>
          <div className="flex gap-3">
            <Link href="/archive">
              <Button variant="outline" data-testid="button-archive">
                Archive
              </Button>
            </Link>
            <Link href="/journey">
              <Button variant="outline" data-testid="button-journey">
                Journey
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-4 gap-3">
          <Stat label="Streak" value={String(player.streak)} accent />
          <Stat label="Best" value={String(player.bestStreak)} />
          <Stat label="Played" value={String(player.totalPlayed)} />
          <Stat label="Perfect" value={String(player.totalWon)} />
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          New puzzle at midnight UTC. Don't break the streak.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-3 text-center">
      <div className={`text-lg font-black ${accent ? "text-accent" : "text-foreground"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
