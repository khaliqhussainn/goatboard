import { Check, Clock, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLE_CAMPAIGN, type DistributionCampaign, type SubmissionStatus } from "@/lib/distribution";

const STATUS_STYLES: Record<SubmissionStatus, { label: string; chip: string; Icon: typeof Check }> = {
  accepted: { label: "Accepted", chip: "bg-accent-green text-green-700", Icon: Check },
  pending: { label: "Pending", chip: "bg-accent-yellow text-yellow-800", Icon: Clock },
  rejected: { label: "Rejected", chip: "bg-accent-pink text-red-600", Icon: X },
};

function StatusChip({ status }: { status: SubmissionStatus }) {
  const { label, chip, Icon } = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        chip,
      )}
    >
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}

/**
 * The example campaign, shown so founders can see what they'd actually get
 * back rather than reading a description of it.
 *
 * Takes the campaign as a prop with the sample as the default, so wiring this
 * to a real campaign later means passing one in - no rewrite. Everything it
 * renders is derived from that object; nothing is hardcoded in the markup.
 */
export function DistributionDashboard({
  campaign = SAMPLE_CAMPAIGN,
  /** Labels the figures as illustrative. Turn off once these are real. */
  sample = true,
}: {
  campaign?: DistributionCampaign;
  sample?: boolean;
}) {
  const percent = Math.round((campaign.submitted / campaign.total) * 100);
  const counts: { status: SubmissionStatus; value: number }[] = [
    { status: "accepted", value: campaign.accepted },
    { status: "pending", value: campaign.pending },
    { status: "rejected", value: campaign.rejected },
  ];

  return (
    <div className="billboard-surface-lg flex flex-col gap-5 rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Your distribution campaign
          </span>
          {sample && (
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Sample
            </span>
          )}
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
          {campaign.reference}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight tabular-nums sm:text-4xl">
            {campaign.submitted}
          </span>
          <span className="text-sm font-semibold text-muted-foreground">
            / {campaign.total} submissions
          </span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={campaign.submitted}
          aria-valuemin={0}
          aria-valuemax={campaign.total}
          aria-label="Submissions sent"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-hero-purple to-hero-pink"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Status counts sit three-up even on a phone: they're short numbers and
          stacking them would push the submission list off the first screen. */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {counts.map(({ status, value }) => (
          <div
            key={status}
            className="flex flex-col gap-1.5 rounded-2xl border border-border p-3 sm:flex-row sm:items-center sm:gap-2.5 sm:p-4"
          >
            <span className="text-xl font-black tracking-tight tabular-nums sm:text-2xl">
              {value}
            </span>
            <StatusChip status={status} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Recent submissions
          </span>
          <ul className="flex flex-col divide-y divide-border">
            {campaign.recent.map((item) => (
              <li key={item.name} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span>
                <StatusChip status={item.status} />
                <span className="w-14 shrink-0 text-right text-[11px] text-muted-foreground">
                  {item.when}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Where it went
          </span>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {campaign.channels.map((channel) => (
              <div
                key={channel.label}
                className="flex min-w-0 flex-col gap-0.5 rounded-2xl bg-muted/60 p-3"
              >
                <span className="text-xl font-black tracking-tight tabular-nums">
                  {channel.count}
                </span>
                <span className="text-[11px] font-medium leading-tight text-muted-foreground">
                  {channel.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="inline-flex items-center gap-1 text-sm font-bold">
        View full submission report <ArrowRight className="size-4" />
      </span>
    </div>
  );
}
