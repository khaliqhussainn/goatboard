"use client";

import * as React from "react";
import { Megaphone, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { AdSlotForm } from "@/components/billboard/ad-slot-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AD_SLOT_PRICING, AD_SLOT_DURATIONS } from "@/lib/validation";
import { formatMoney } from "@/lib/utils";
import type { CurrentAd } from "@/lib/types";

export function AdSlotDisplay({ ad }: { ad: CurrentAd | null }) {
  const [open, setOpen] = React.useState(false);

  if (ad) {
    return (
      <div className="billboard-surface flex flex-col items-center gap-3 rounded-[1.75rem] p-6 text-center sm:flex-row sm:text-left">
        <CampaignAvatar
          src={ad.image_url}
          name={ad.name}
          className="size-16 shrink-0 rounded-2xl text-xl"
        />
        <div className="min-w-0 flex-1">
          <Badge variant="purple" className="mb-1.5">
            Sponsored
          </Badge>
          <p className="truncate text-lg font-black tracking-tight">{ad.name}</p>
          <p className="line-clamp-1 text-sm text-muted-foreground">{ad.description}</p>
        </div>
        <a href={ad.destination_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <Button variant="outline" size="sm">
            Visit <ExternalLink className="size-3.5" />
          </Button>
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="billboard-surface flex flex-col items-center gap-4 rounded-[1.75rem] border-2 border-dashed border-accent-purple p-6 text-center sm:flex-row sm:text-left">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-accent-purple text-purple-600">
          <Megaphone className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <Badge variant="purple" className="mb-1.5">
            Ad space
          </Badge>
          <p className="text-lg font-black tracking-tight">Your product could be here</p>
          <p className="text-sm text-muted-foreground">
            The only ad spot on GOATBOARD - right below the #1 goat.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground sm:justify-end">
            {AD_SLOT_DURATIONS.map((days) => (
              <span key={days} className="rounded-full bg-muted px-2 py-1">
                {days}d · {formatMoney(AD_SLOT_PRICING[days])}
              </span>
            ))}
          </div>
          <Button size="sm" variant="abstract" onClick={() => setOpen(true)}>
            Rent this spot
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rent the ad spot</DialogTitle>
          </DialogHeader>
          <AdSlotForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
