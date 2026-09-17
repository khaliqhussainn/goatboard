import Link from "next/link";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { ACTIVITY_CONFIG, shortAgo, type Activity } from "@/lib/activity";

/**
 * One event on the activity feed. `now` is passed down from the page rather
 * than read with Date.now() in here, so every card on the same render agrees
 * on what "now" is instead of drifting by however long the map takes.
 */
export function ActivityCard({ activity, now }: { activity: Activity; now: number }) {
  const config = ACTIVITY_CONFIG[activity.kind];

  return (
    <div className="billboard-surface-sm flex gap-3 rounded-2xl p-4">
      <div
        className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: config.color }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={config.mascot} alt="" className="size-[85%] object-contain" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: config.color, color: config.ink }}
          >
            {config.tag}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {shortAgo(activity.at, now)}
          </span>
        </div>

        <p className="text-sm font-bold leading-snug">{activity.headline}</p>
        <p className="text-xs text-muted-foreground">{activity.detail}</p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href={`/campaign/${activity.campaign.slug}`}
            className="flex min-w-0 items-center gap-1.5 text-xs font-semibold transition-colors hover:text-hero-pink hover:underline"
          >
            <CampaignAvatar
              src={activity.campaign.image_url}
              name={activity.campaign.name}
              className="size-5 shrink-0 text-[9px]"
            />
            <span className="truncate">{activity.campaign.name}</span>
          </Link>

          {activity.opponent && (
            <>
              <span className="text-xs text-muted-foreground">vs</span>
              <Link
                href={`/campaign/${activity.opponent.slug}`}
                className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-hero-pink hover:underline"
              >
                <CampaignAvatar
                  src={activity.opponent.image_url}
                  name={activity.opponent.name}
                  className="size-5 shrink-0 text-[9px]"
                />
                <span className="truncate">{activity.opponent.name}</span>
              </Link>
            </>
          )}

          {activity.stats.map((stat) => (
            <span key={stat.label} className="shrink-0 text-xs font-semibold tabular-nums">
              {stat.value} <span className="font-normal text-muted-foreground">{stat.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
