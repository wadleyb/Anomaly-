import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyTodayResponse } from "@/lib/api-types";

export default function Home() {
  const { data, isLoading } = useQuery<DailyTodayResponse>({
    queryKey: ["/api/daily/today"],
  });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-xl px-6 pt-10 pb-16">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Logo className="h-7 w-7" />
            <span className="text-base font-bold tracking-tight">ANOMALY</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link
              href="/archive"
              className="font-semibold uppercase tracking-wider hover:text-foreground transition-colors"
              data-testid="link-archive"
            >
              Archive
            </Link>
            <Link
              href="/journey"
              className="font-semibold uppercase tracking-wider hover:text-foreground transition-colors"
              data-testid="link-journey"
            >
              Journey
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div className="mt-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            {isLoading ? <Skeleton className="mx-auto h-4 w-28" /> : `Day #${data?.day}`}
          </p>
          <h1 className="mt-3 text-xl font-black tracking-tight sm:text-xl" data-testid="text-hero-title">
            Spot the odd one out.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
            5 puzzles. One minute. New every day at midnight UTC.
          </p>
        </div>

        {/* Decorative grid preview with a single anomaly */}
        <div className="mx-auto mt-10 grid max-w-[280px] grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-md"
              style={{
                background:
                  i === 6
                    ? "hsl(var(--accent))"
                    : "hsl(var(--card))",
                border: "1px solid hsl(var(--card-border))",
              }}
            />
          ))}
        </div>

        {/* Primary CTA */}
        <div className="mt-12 flex flex-col items-center gap-3">
          {isLoading ? (
            <Skeleton className="h-14 w-64" />
          ) : data?.played ? (
            <>
              <Link href="/result">
                <Button
                  size="lg"
                  className="h-14 w-64 text-base font-bold tracking-wide"
                  data-testid="button-view-result"
                >
                  VIEW TODAY'S RESULT
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                Done · come back tomorrow at midnight UTC
              </p>
            </>
          ) : (
            <>
              <Link href="/play">
                <Button
                  size="lg"
                  className="h-14 w-64 text-base font-bold tracking-wide"
                  data-testid="button-play"
                >
                  PLAY · DAY #{data?.day}
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">~1 minute · 5 puzzles</p>
            </>
          )}
        </div>

        {/* Streak / stats pills */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          <StatPill
            label="Streak"
            value={isLoading ? "…" : `${data?.player.streak ?? 0}`}
            accent
          />
          <StatPill
            label="Best"
            value={isLoading ? "…" : `${data?.player.bestStreak ?? 0}`}
          />
          <StatPill
            label="Played today"
            value={
              isLoading
                ? "…"
                : (data?.globalPlays ?? 0).toLocaleString()
            }
          />
        </div>

        {/* How it works */}
        <div className="mt-12 rounded-xl border border-card-border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            How it works
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="font-mono text-muted-foreground">01</span>
              <span>Five grids. Each has one shape that doesn't belong.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-muted-foreground">02</span>
              <span>Tap it. Faster = better. Wrong = a red square on your card.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-muted-foreground">03</span>
              <span>Share your grid. Build your streak. Don't miss a day.</span>
            </li>
          </ol>
        </div>

        {/* Footer */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Made for people who like staring at squares.
        </p>
      </div>
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="rounded-xl border border-card-border bg-card p-3 text-center"
      data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div
        className={`text-lg font-black ${accent ? "text-accent" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
