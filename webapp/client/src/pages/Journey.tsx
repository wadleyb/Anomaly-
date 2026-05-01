import { Link } from "wouter";
import { Logo } from "@/components/Logo";

export default function Journey() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-xl px-6 pt-10 pb-16">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <Logo className="h-7 w-7" />
            <span className="text-base font-bold tracking-tight">ANOMALY</span>
          </Link>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Journey
          </span>
        </div>

        <div className="mt-20 rounded-2xl border border-card-border bg-card p-10 text-center">
          <div className="text-4xl">🗺️</div>
          <h1 className="mt-4 text-xl font-black tracking-tight">Journey is in the app</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            500 hand-tuned levels, lives that regen, soundtrack unlocks. Available on the mobile app
            soon — for now, the daily is the way.
          </p>
          <Link href="/">
            <button
              className="mt-6 text-xs font-semibold uppercase tracking-wider text-foreground underline"
              data-testid="link-back-home"
            >
              Back to today's daily
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
