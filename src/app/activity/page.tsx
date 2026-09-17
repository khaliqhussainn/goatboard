import type { Metadata } from "next";
import Link from "next/link";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { ActivityCard } from "@/components/billboard/activity-card";
import { getActivityFeed } from "@/lib/queries/activity";
import { ACTIVITY_FILTERS } from "@/lib/activity";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Activity",
  description:
    "Everything happening on GOATBOARD right now - new GOATs, overtakes, and milestones.",
};

const DEFAULT_DAYS = 7;
const LOAD_MORE_STEP = 7;
const MAX_DAYS = 90;

function feedHref(filter: string, days: number) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (days !== DEFAULT_DAYS) params.set("days", String(days));
  const qs = params.toString();
  return qs ? `/activity?${qs}` : "/activity";
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; days?: string }>;
}) {
  const { filter: filterParam, days: daysParam } = await searchParams;
  const activeFilter = ACTIVITY_FILTERS.find((f) => f.key === filterParam) ?? ACTIVITY_FILTERS[0];
  const days = Math.min(Math.max(Number(daysParam) || DEFAULT_DAYS, DEFAULT_DAYS), MAX_DAYS);

  const activities = await getActivityFeed(days);
  const visible = activities.filter((a) => activeFilter.kinds.includes(a.kind));
  const now = new Date().getTime();

  return (
    <div className="on-backdrop mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />

      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Activity</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything happening on the board - new GOATs, overtakes, and milestones.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {ACTIVITY_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={feedHref(f.key, days)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              activeFilter.key === f.key
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-hero-pink hover:text-hero-pink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {visible.length === 0 ? (
          <div className="billboard-surface-lg flex flex-col items-center gap-2 rounded-[2rem] py-16 text-center">
            <p className="text-lg font-black tracking-tight">Nothing here yet.</p>
            <p className="text-sm text-muted-foreground">
              Check back once the board starts moving, or widen the window below.
            </p>
          </div>
        ) : (
          visible.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} now={now} />
          ))
        )}
      </div>

      {days < MAX_DAYS && (
        <div className="mt-6 flex justify-center">
          <Link
            href={feedHref(activeFilter.key, Math.min(days + LOAD_MORE_STEP, MAX_DAYS))}
            className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-hero-pink hover:underline"
          >
            Load more ({Math.min(days + LOAD_MORE_STEP, MAX_DAYS)} days)
          </Link>
        </div>
      )}
    </div>
  );
}
