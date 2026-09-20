"use client";

import * as React from "react";
import { Eye, Users, DollarSign, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { cn, formatEarnings } from "@/lib/utils";
import { AnimatedNumber } from "@/components/billboard/animated-number";
import { VisitorActivityChart } from "@/components/billboard/visitor-activity-chart";
import type { VisitorStats } from "@/lib/types";

const SESSION_KEY = "goatboard_visit_recorded";
const HEARTBEAT_MS = 30_000;
const POLL_MS = 20_000;

/**
 * Driven browsers (Playwright, Puppeteer, Selenium) send an ordinary user
 * agent, so the server-side filter in lib/bots.ts can't see them - but they
 * set this flag. Catches scrapers that render the page, and our own
 * screenshot runs, neither of which is a visitor.
 */
function isAutomated() {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}

/** vs the previous 12h, from the same 24 hourly buckets the sparkline draws. */
function useActivityDelta(activity: VisitorStats["activity"]) {
  return React.useMemo(() => {
    if (activity.length < 24) return null;
    const previous = activity.slice(0, 12).reduce((sum, p) => sum + p.visits, 0);
    const recent = activity.slice(12).reduce((sum, p) => sum + p.visits, 0);
    if (previous === 0) return null;
    return Math.round(((recent - previous) / previous) * 100);
  }, [activity]);
}

/** Stat tiles for the sidebar beside the #1 spotlight: a full-width visitor
 * count, then live-visitors and earnings paired as two squares, then the 24h
 * sparkline. Each is its own billboard-surface card rather than one combined
 * panel, so they read as a stack of tiles at every width. */
export function VisitorStatsCard({ initial }: { initial: VisitorStats }) {
  const [stats, setStats] = React.useState(initial);
  const delta = useActivityDelta(stats.activity);

  React.useEffect(() => {
    if (isAutomated()) return;

    let alreadyVisited = false;
    try {
      alreadyVisited = sessionStorage.getItem(SESSION_KEY) === "1";
      if (!alreadyVisited) sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable (private browsing) — fall through and record anyway.
    }
    if (alreadyVisited) return;

    fetch("/api/visits", { method: "POST" })
      .then((res) => {
        if (res.ok) setStats((s) => ({ ...s, totalVisits: s.totalVisits + 1 }));
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (isAutomated()) return;

    const sendHeartbeat = () => {
      fetch("/api/visits/heartbeat", { method: "POST" }).catch(() => {});
    };
    sendHeartbeat();
    const id = setInterval(sendHeartbeat, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => {
      fetch("/api/visits/stats")
        .then((res) => (res.ok ? (res.json() as Promise<VisitorStats>) : null))
        .then((data) => data && setStats(data))
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="billboard-surface col-span-2 flex flex-col gap-1.5 rounded-2xl p-4 lg:col-span-1">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-blue text-blue-600">
            <Eye className="size-3.5" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Total Visitors
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <AnimatedNumber
            value={stats.totalVisits}
            className="text-2xl font-black tracking-tight tabular-nums"
          />
          {delta !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                delta >= 0 ? "bg-accent-green text-green-700" : "bg-accent-pink text-red-600",
              )}
            >
              {delta >= 0 ? <ArrowUp className="size-2.5" /> : <ArrowDown className="size-2.5" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">vs previous 12h</p>
      </div>

      {/* Paired squares. The wrapper spans the parent's two phone columns and
          re-splits them itself, so the pairing survives the sidebar switching
          from a two-column grid to a single stacked column at lg. */}
      <div className="col-span-2 grid grid-cols-2 gap-4 lg:col-span-1">
        <div className="billboard-surface flex aspect-square flex-col justify-between rounded-2xl p-3.5">
        <div className="flex items-center justify-between gap-1.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-green text-green-600">
            <Users className="size-3.5" />
          </span>
          {/* The square leaves no room for the word beside the count, and the
              label already says "live" — so only the pulsing dot rides here. */}
          <span className="relative flex size-1.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-green-600" />
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase leading-tight tracking-[0.08em] text-muted-foreground">
            Live Users
          </span>
          <AnimatedNumber
            value={stats.liveVisitors}
            className="text-2xl font-black leading-none tracking-tight tabular-nums"
          />
        </div>
        </div>

        <div className="billboard-surface flex aspect-square flex-col justify-between rounded-2xl p-3.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-purple text-purple-600">
            <DollarSign className="size-3.5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase leading-tight tracking-[0.08em] text-muted-foreground">
              Total Earnings
            </span>
            {/* No delta or comparison window here: this is a running total, not
                a trend, and a percentage next to it would invite reading it as one. */}
            <span className="text-xl font-black leading-none tracking-tight tabular-nums">
              {formatEarnings(stats.totalEarnings)}
            </span>
          </div>
        </div>
      </div>

      <div className="billboard-surface col-span-2 flex flex-1 flex-col gap-1.5 rounded-2xl p-4 lg:col-span-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Visitor activity
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Last 24h <ChevronDown className="size-2.5" />
          </span>
        </div>
        <div className="flex-1">
          <VisitorActivityChart activity={stats.activity} />
        </div>
      </div>
    </>
  );
}
