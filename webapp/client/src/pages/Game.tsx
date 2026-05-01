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

const PER_PUZZLE_MS = 12000; // 12s timeout per puzzle

export default function Game() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<DailyTodayResponse>({
    queryKey: ["/api/daily/today"],
  });

  // If they already played, redirect to result.
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
  const [timeLeft, setTimeLeft] = useState(PER_PUZZLE_MS);
  const startedAtRef = useRef<number>(performance.now());
  const puzzleStartRef = useRef<number>(performance.now());

  // Timer tick
  useEffect(() => {
    if (feedback) return;
    puzzleStartRef.current = performance.now();
    setTimeLeft(PER_PUZZLE_MS);
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() - puzzleStartRef.current;
      const left = Math.max(0, PER_PUZZLE_MS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        timeOut();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

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

  function advance(next: Array<"🟩" | "🟥">) {
    if (next.length >= 5) {
      const totalMs = Math.round(performance.now() - startedAtRef.current);
      submit.mutate({ results: next, totalMs });
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
    setTimeout(() => advance(next), correct ? 450 : 700);
  }

  function timeOut() {
    if (feedback) return;
    setFeedback({ correct: false, tappedIdx: -1 });
    const next: Array<"🟩" | "🟥"> = [...results, "🟥"];
    setResults(next);
    setTimeout(() => advance(next), 800);
  }

  const puzzle = puzzles[idx];
  const pct = Math.max(0, Math.min(100, (timeLeft / PER_PUZZLE_MS) * 100));
  const barTone =
    pct < 25 ? "bg-destructive" : pct < 50 ? "bg-accent" : "bg-foreground";

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

      {/* Result strip — what's been answered so far */}
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

      {/* Timer */}
      <div className="mx-auto mt-6 h-1.5 w-full max-w-md rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${barTone} transition-[width] duration-100`}
          style={{ width: `${pct}%` }}
          data-testid="bar-timer"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div
          className="grid w-full max-w-md gap-3"
          style={{
            gridTemplateColumns: `repeat(${puzzle.gridSize}, minmax(0, 1fr))`,
          }}
          data-testid="grid-puzzle"
        >
          {puzzle.grid.map((cell, i) => {
            const isTapped = feedback?.tappedIdx === i;
            const isAnomaly = i === puzzle.anomalyIndex;
            const showCorrect =
              feedback && (isTapped && feedback.correct);
            const showWrong = feedback && isTapped && !feedback.correct;
            const showReveal = feedback && !feedback.correct && isAnomaly;

            return (
              <button
                key={i}
                onClick={() => handleTap(i)}
                disabled={!!feedback}
                className={`aspect-square rounded-xl border bg-card p-2 transition-all active:scale-95 ${
                  showCorrect
                    ? "border-foreground bg-accent"
                    : showWrong
                    ? "border-destructive bg-destructive/10"
                    : showReveal
                    ? "border-accent bg-accent/30"
                    : "border-card-border hover:border-foreground/40"
                }`}
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
