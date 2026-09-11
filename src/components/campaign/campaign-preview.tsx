import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { XLogo } from "@/components/icons/x-logo";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";

export function CampaignPreview({
  name,
  description,
  imageUrl,
  category,
  xHandle,
}: {
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  xHandle?: string;
}) {
  return (
    <div className="billboard-surface-lg flex flex-col items-center gap-3 rounded-[1.75rem] p-6 text-center">
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        🐐 GOAT right now
      </span>
      <CampaignAvatar
        src={imageUrl}
        name={name || "?"}
        className="size-20 text-3xl"
      />
      <div className="flex w-full min-w-0 flex-col items-center gap-2">
        <p className="line-clamp-2 w-full wrap-break-word text-xl font-black tracking-tight">
          {name || "Your campaign name"}
        </p>
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
          <Badge variant={categoryAccent(category)}>{categoryLabel(category)}</Badge>
          {xHandle && (
            <span className="inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-muted-foreground">
              <XLogo className="size-3.5 shrink-0" />
              <span className="min-w-0 truncate">@{xHandle.replace(/^@/, "")}</span>
            </span>
          )}
        </div>
      </div>
      <p className="text-3xl font-black tabular-nums tracking-tight">0 Power</p>
      <p className="line-clamp-2 max-w-sm text-sm text-muted-foreground">
        {description || "Your short description will show up here."}
      </p>
      <div className="flex gap-3 text-sm font-semibold text-muted-foreground">
        <span className="rounded-xl bg-foreground px-4 py-2 text-background">Vote ↑</span>
        <span className="rounded-xl border border-border px-4 py-2">Boost $</span>
      </div>
    </div>
  );
}
