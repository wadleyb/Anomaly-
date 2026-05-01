import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateDailyPuzzles } from "@/lib/puzzle";
import { Shape } from "@/components/Shape";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyTodayResponse, SubmitResponse } from "@/lib/api-types";

// Single steady budget for the whole daily — feels consistent.
const TOTAL_BUDGET_MS = 35_000; // 7s per puzzle on average

export default function Game() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<DailyTodayResponse>({
    queryKey: ["/api/daily/today"],
  });

  useEffect(() => {
    if (data?.played) setLocation("/result");
  }, [data?.played, setLocation]);

  if (isLoading || !data) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }
  if (data.played) return null;

  return <GameInner day={data.day} />;
}

function GameInner({ day }: { day: number }) {
  const [, setLocation] = useLocation();
  const puzzles = useMemo(() => generateDailyPuzzles(day), [day]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Array<"🟩" | "🟥">>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; tappedIdx: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(TOTAL_BUDGET_MS);
  const startedAtRef = useRef<number>(performance.now());

  // ONE continuous global timer. Doesn't reset between puzzles. No more
  // weird "speeding up / slowing down" feeling — same drain rate always.
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() - startedAtRef.current;
      const left = Math.max(0, TOTAL_BUDGET_MS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        // Time ran out — fill remaining puzzles as misses and finish.
        endByTimeout();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = useMutation<SubmitResponse, Error, { results: Array<"🟩" | "🟥">; totalMs: number }>({
    mutationFn: async (body) => {
      const res = await apiRequest("POST", "/api/daily/submit", { day, ...body });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/history"] });
      setLocation("/result");
    },
  });

  function finish(final: Array<"🟩" | "🟥">) {
    const totalMs = Math.round(performance.now() - startedAtRef.current);
    submit.mutate({ results: final, totalMs });
  }

  function advance(next: Array<"🟩" | "🟥">) {
    if (next.length >= 5) {
      finish(next);
      return;
    }
    setIdx((i) => i + 1);
    setFeedback(null);
  }

  function handleTap(i: number) {
    if (feedback) return;
    const correct = i === puzzles[idx].anomalyIndex;
    setFeedback({ correct, tappedIdx: i });
    const next = [...results, correct ? ("🟩" as const) : ("🟥" as const)];
    setResults(next);
    setTimeout(() => advance(next), correct ? 350 : 600);
  }

  function endByTimeout() {
    // Fill any remaining puzzles as 🟥 and submit.
    const remaining = 5 - results.length;
    if (remaining <= 0) return;
    const final: Array<"🟩" | "🟥"> = [
      ...results,
      ...Array.from({ length: remaining }, () => "🟥" as const),
    ];
    finish(final);
  }

  const puzzle = puzzles[idx];
  const pct = Math.max(0, Math.min(100, (timeLeft / TOTAL_BUDGET_MS) * 100));
  const barTone =
    pct < 20 ? "bg-destructive" : pct < 40 ? "bg-accent" : "bg-foreground";

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="text-sm font-bold tracking-tight">ANOMALY</span>
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Day #{day} · {idx + 1}/5
        </div>
      </div>

      {/* Progress pips */}
      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="text-2xl leading-none transition-opacity"
            style={{ opacity: i < results.length ? 1 : 0.18 }}
            data-testid={`pip-result-${i}`}
          >
            {results[i] ?? "⬜"}
          </span>
        ))}
      </div>

      {/* Single steady global timer */}
      <div className="mx-auto mt-6 h-1.5 w-full max-w-md rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${barTone}`}
          style={{ width: `${pct}%`, transition: "width 80ms linear, background-color 200ms" }}
          data-testid="bar-timer"
        />
      </div>
      <div className="mx-auto mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {Math.ceil(timeLeft / 1000)}s left
      </div>

      {/* Grid — shapes float, no tile borders */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div
          className="grid w-full max-w-md gap-1"
          style={{
            gridTemplateColumns: `repeat(${puzzle.gridSize}, minmax(0, 1fr))`,
          }}
          data-testid="grid-puzzle"
        >
          {puzzle.grid.map((cell, i) => {
            const isTapped = feedback?.tappedIdx === i;
            const isAnomaly = i === puzzle.anomalyIndex;
            const showCorrect = feedback && isTapped && feedback.correct;
            const showWrong = feedback && isTapped && !feedback.correct;
            const showReveal = feedback && !feedback.correct && isAnomaly;

            return (
              <button
                key={i}
                onClick={() => handleTap(i)}
                disabled={!!feedback}
                aria-label={`Cell ${i}`}
                className="aspect-square p-2 transition-transform active:scale-90 focus:outline-none rounded-md"
                style={{
                  background: showCorrect
                    ? "hsl(var(--accent) / 0.25)"
                    : showWrong
                    ? "hsl(var(--destructive) / 0.18)"
                    : showReveal
                    ? "hsl(var(--accent) / 0.18)"
                    : "transparent",
                }}
                data-testid={`button-cell-${i}`}
              >
                <Shape shape={cell} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Quit */}
      <div className="px-6 pb-8 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("Quit? Your progress will be lost.")) setLocation("/");
          }}
          data-testid="button-quit"
        >
          Quit
        </Button>
      </div>
    </div>
  );
}
