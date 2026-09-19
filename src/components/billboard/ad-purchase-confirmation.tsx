"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";

export function AdPurchaseConfirmation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adPurchased = searchParams.get("ad_purchased");
  const videoAdPurchased = searchParams.get("video_ad_purchased");

  React.useEffect(() => {
    if (!adPurchased) return;
    toast.success(`You're renting the ad spot for ${adPurchased} days.`);
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adPurchased]);

  React.useEffect(() => {
    if (!videoAdPurchased) return;
    toast.success("You're renting the video spot for 7 days.");
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoAdPurchased]);

  return null;
}
