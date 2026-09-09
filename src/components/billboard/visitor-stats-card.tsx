"use client";

import * as React from "react";
import { Eye, Users, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/billboard/animated-number";
import { VisitorActivityChart } from "@/components/billboard/visitor-activity-chart";
import type { VisitorStats } from "@/lib/types";

const SESSION_KEY = "goatboard_visit_recorded";
const HEARTBEAT_MS = 30_000;
const POLL_MS = 20_000;

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

export function VisitorStatsCard({ initial }: { initial: VisitorStats }) {
  const [stats, setStats] = React.useState(initial);
  const delta = useActivityDelta(stats.activity);

  React.useEffect(() => {
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
    <div className="billboard-surface grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="flex flex-col gap-1.5 p-3.5 sm:p-4">
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
            className="text-xl font-black tracking-tight tabular-nums sm:text-2xl"
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
        <p className="text-[11px] text-muted-foreground">All-time visits</p>
      </div>

      <div className="flex flex-col gap-1.5 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-green text-green-600">
              <Users className="size-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Live Visitors
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-green px-1.5 py-0.5 text-[10px] font-bold text-green-700">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-green-600" />
            </span>
            Live
          </span>
        </div>
        <AnimatedNumber
          value={stats.liveVisitors}
          className="text-xl font-black tracking-tight tabular-nums sm:text-2xl"
        />
        <p className="text-[11px] text-muted-foreground">Browsing right now</p>
      </div>

      <div className="flex flex-col gap-1.5 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Visitor activity
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Last 24h <ChevronDown className="size-2.5" />
          </span>
        </div>
        <VisitorActivityChart activity={stats.activity} />
      </div>
    </div>
  );
}
