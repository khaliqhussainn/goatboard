"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Link2, Rocket, Zap } from "lucide-react";
import goatMascot from "../../../public/get-listed-popup-goat.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type GetListedPromoModalProps =
  | { mode: "homepage"; checkoutUrl?: never }
  | { mode: "post-submit"; checkoutUrl: string };

/**
 * The homepage version waits five seconds. The post-submit version opens as
 * soon as the product has safely been created, before leaving for checkout.
 */
export function GetListedPromoModal({ mode, checkoutUrl }: GetListedPromoModalProps) {
  const [open, setOpen] = React.useState(mode === "post-submit");

  React.useEffect(() => {
    if (mode !== "homepage") return;
    const timer = window.setTimeout(() => setOpen(true), 5_000);
    return () => window.clearTimeout(timer);
  }, [mode]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setOpen(true);
      return;
    }

    setOpen(false);
    // At this point the campaign row already exists. Closing the offer must
    // preserve the visitor's original intent and continue its paid listing.
    if (mode === "post-submit") window.location.assign(checkoutUrl);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="pretty-scroll max-h-[calc(100dvh-1.5rem)] max-w-5xl gap-0 overflow-x-hidden overflow-y-auto rounded-[2rem] border-0 bg-[#fffaf1] p-0 shadow-[0_36px_120px_rgba(4,8,25,0.48)] sm:w-[calc(100%-3rem)] [&>button]:right-5 [&>button]:top-5 [&>button]:z-20 [&>button]:rounded-full [&>button]:bg-white/80 [&>button]:p-2 [&>button]:opacity-100 [&>button]:shadow-sm">
        <div className="grid min-h-[34rem] md:grid-cols-[0.88fr_1.12fr]">
          <div className="relative min-h-56 overflow-hidden bg-[linear-gradient(145deg,#d9c9f2_0%,#c3ddf5_52%,#c9e9d4_100%)] md:min-h-full">
            <div className="absolute -left-16 top-10 size-52 rounded-full bg-white/45 blur-2xl" />
            <div className="absolute -right-12 bottom-10 size-48 rounded-full bg-[#f5e08e]/80 blur-xl" />
            <div className="absolute left-5 top-5 rotate-[-7deg] rounded-full bg-white px-4 py-2 font-handwritten text-sm font-bold shadow-sm sm:left-8 sm:top-8">
              More traffic = more growth
            </div>
            <Zap className="absolute right-8 top-16 size-9 rotate-12 fill-[#f5e08e] text-foreground sm:right-12 sm:top-20" />
            <Image
              src={goatMascot}
              alt="GoatBoard goat pointing toward the Get Listed offer"
              loading="eager"
              sizes="(max-width: 1024px) 70vw, 38vw"
              className="absolute bottom-[-25%] left-1/2 h-auto w-[66%] max-w-sm -translate-x-1/2 drop-shadow-[0_25px_28px_rgba(10,10,10,0.24)] md:bottom-[-3%] md:w-[92%] md:max-w-none"
            />
          </div>

          <div className="relative flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-11 lg:px-12">
            <DialogHeader className="gap-4 text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-purple px-3.5 py-2 text-xs font-black uppercase tracking-[0.12em]">
                <Rocket className="size-4" /> Get more visibility
              </div>
              <DialogTitle className="max-w-xl font-rounded text-3xl font-black leading-[0.98] tracking-[-0.04em] lg:text-5xl">
                Want up to
                <span className="relative mx-2 inline-block whitespace-nowrap px-1">
                  <span className="absolute inset-x-[-0.15em] bottom-[0.02em] top-[0.28em] -rotate-1 rounded-[45%] bg-accent-yellow" />
                  <span className="relative">100 backlinks</span>
                </span>
                and stronger DR?
              </DialogTitle>
              <DialogDescription className="max-w-xl text-sm leading-relaxed text-foreground/70 sm:text-base">
                We do the distribution for you. Get your product listed on relevant directories,
                startup platforms, and discovery sites—without spending days filling out forms.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              <Benefit icon={Link2} label="Quality backlinks" color="bg-accent-green" />
              <Benefit icon={BarChart3} label="Stronger DR" color="bg-accent-purple" />
              <Benefit icon={Zap} label="More visibility" color="bg-accent-blue" />
            </div>

            {mode === "post-submit" && (
              <p className="mt-5 rounded-xl bg-white/75 px-4 py-3 text-xs text-foreground/65">
                Your product draft is safely saved. You can explore distribution now or continue
                directly to your product listing checkout.
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              <Button asChild size="lg" className="w-full rounded-2xl">
                <Link href="/get-listed">
                  Get Listed Now <ArrowRight />
                </Link>
              </Button>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="mx-auto rounded-lg px-3 py-2 text-sm font-semibold text-foreground/65 underline decoration-foreground/25 underline-offset-4 transition-colors hover:text-foreground"
              >
                {mode === "post-submit" ? "Maybe later — continue to checkout" : "Maybe later"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Benefit({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${color}`}>
        <Icon className="size-4" />
      </span>
      <span className="text-[11px] font-black leading-tight sm:text-sm">{label}</span>
    </div>
  );
}
