"use client";

import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/**
 * Wraps intercepted /campaign/[slug] content in a popup instead of a full
 * page. Closing (Escape, overlay click, or the X) calls router.back() so
 * the intercepted route is popped off history rather than treated as a
 * fresh navigation — see Next.js's intercepting-routes modal pattern.
 */
export function CampaignModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] shadow-2xl duration-150 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="sr-only">Campaign details</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Vote, boost, or share this campaign.
          </DialogPrimitive.Description>
          {/* Scrolling lives on this inner wrapper, not DialogPrimitive.Content
              itself — an absolutely-positioned child of a scrolling element
              scrolls away with it, which would carry the Close button off
              along with tall content. */}
          <div className="max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-[1.75rem]">
            {children}
          </div>
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute right-4 top-4 z-10 rounded-lg bg-white/95 p-1.5 text-black opacity-90 shadow-md transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
