import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { Skeleton } from "@/components/ui/skeleton";
import type { HistoryResponse } from "@/lib/api-types";

export default function Archive() {
  const { data, isLoading } = useQuery<HistoryResponse>({
    queryKey: ["/api/player/history"],
  });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-xl px-6 pt-10 pb-16">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <Logo className="h-7 w-7" />
            <span className="text-base font-bold tracking-tight">ANOMALY</span>
          </Link>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Archive
          </span>
        </div>

        <h1 className="mt-12 text-xl font-black tracking-tight">Your archive</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every daily you've played. Streak resets if you miss a day.
        </p>

        {/* Stats */}
        {data && (
          <div className="mt-8 grid grid-cols-4 gap-3">
            <Stat label="Streak" value={String(data.player.streak)} accent />
            <Stat label="Best" value={String(data.player.bestStreak)} />
            <Stat label="Played" value={String(data.player.totalPlayed)} />
            <Stat label="Perfect" value={String(data.player.totalWon)} />
          </div>
        )}

        {/* List */}
        <div className="mt-10 space-y-2">
          {isLoading && (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          )}

          {data && data.history.length === 0 && (
            <div className="rounded-xl border border-card-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't played yet. Today is{" "}
                <Link href="/" className="font-semibold text-foreground underline">
                  Day #{data.currentDay}
                </Link>
                .
              </p>
            </div>
          )}

          {data?.history.map((row) => {
            const seconds = Math.round(row.totalMs / 1000);
            const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
            return (
              <div
                key={row.day}
                className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3"
                data-testid={`row-day-${row.day}`}
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Day #{row.day}
                  </div>
                  <div className="mt-1 text-sm">
                    {row.greens}/5 · {time}
                  </div>
                </div>
                <div className="text-2xl tracking-[0.1em]" data-testid={`text-grid-${row.day}`}>
                  {row.results.join("")}
                </div>
              </div>
            );
          })}
        </div>
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
