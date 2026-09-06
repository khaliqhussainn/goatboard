"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";

export function PaymentConfirmation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const boosted = searchParams.get("boosted");

  React.useEffect(() => {
    if (!boosted) return;
    toast.success(`Boost successful - +${boosted} Power`);
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boosted]);

  return null;
}
