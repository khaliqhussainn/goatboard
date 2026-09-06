import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { Badge } from "@/components/ui/badge";
import { categoryAccent, categoryLabel } from "@/lib/categories";

export function CampaignPreview({
  name,
  description,
  imageUrl,
  category,
}: {
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
}) {
  return (
    <div className="billboard-surface-lg flex flex-col items-center gap-4 rounded-[2rem] p-8 text-center">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        #1 right now
      </span>
      <CampaignAvatar
        src={imageUrl}
        name={name || "?"}
        className="size-24 text-4xl"
      />
      <div className="flex flex-col items-center gap-2">
        <p className="text-2xl font-black tracking-tight">{name || "Your campaign name"}</p>
        <Badge variant={categoryAccent(category)}>{categoryLabel(category)}</Badge>
      </div>
      <p className="text-4xl font-black tabular-nums tracking-tight">0 Power</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {description || "Your short description will show up here."}
      </p>
      <div className="flex gap-3 text-sm font-semibold text-muted-foreground">
        <span className="rounded-xl bg-foreground px-4 py-2 text-background">Vote ↑</span>
        <span className="rounded-xl border border-border px-4 py-2">Boost $</span>
      </div>
    </div>
  );
}
