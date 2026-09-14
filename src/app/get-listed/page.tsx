import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GET_LISTED_PACKAGE_LIST,
  GET_LISTED_STEPS,
  GET_LISTED_DISCLOSURES,
} from "@/lib/get-listed";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Get Listed",
  description:
    "We manually submit your startup to relevant directories and discovery platforms, and track every submission for you.",
};

export default function GetListedPage() {
  return (
    <div className="on-backdrop mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />

      <header className="flex flex-col items-start gap-3">
        <Badge variant="yellow">Beta</Badge>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Get Listed</h1>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          We manually submit your startup to relevant directories, communities and discovery
          platforms, list it on GOATBOARD, and track every submission so you can see exactly where
          it went and what happened.
        </p>
      </header>

      {/* Packages */}
      <section className="mt-10">
        <h2 className="text-xl font-black tracking-tight">Packages</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {GET_LISTED_PACKAGE_LIST.map((pkg) => (
            <div
              key={pkg.key}
              className="billboard-surface flex flex-col gap-3 rounded-[1.75rem] p-5"
            >
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-black tracking-tight">{pkg.name}</h3>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {pkg.summary}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tight tabular-nums">
                  {formatMoney(pkg.priceUsd)}
                </span>
                <span className="text-sm text-muted-foreground">one-time</span>
              </div>

              <ul className="flex flex-1 flex-col gap-1.5">
                {pkg.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href={`/get-listed/start?package=${pkg.key}`} className="mt-auto">
                <Button variant="abstract" className="w-full">
                  Choose {pkg.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-10">
        <h2 className="text-xl font-black tracking-tight">How it works</h2>
        <ol className="mt-4 flex flex-col gap-3">
          {GET_LISTED_STEPS.map((step) => (
            <li
              key={step.step}
              className="billboard-surface flex gap-4 rounded-[1.75rem] p-5"
            >
              <span className="text-xl font-black tracking-tight tabular-nums text-muted-foreground">
                {step.step}
              </span>
              <div className="min-w-0">
                <h3 className="font-black tracking-tight">{step.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* What this is and isn't. Same text the Terms uses. */}
      <section className="mt-10">
        <h2 className="text-xl font-black tracking-tight">What you&apos;re buying</h2>
        <ul className="billboard-surface mt-4 flex flex-col gap-2 rounded-[1.75rem] p-5">
          {GET_LISTED_DISCLOSURES.map((line) => (
            <li key={line} className="text-sm text-muted-foreground">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 flex flex-col items-start gap-3">
        <Link href="/get-listed/start">
          <Button size="lg" variant="abstract">
            Start a campaign
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground">
          Already bought one?{" "}
          <Link href="/my-campaigns" className="font-semibold underline underline-offset-4">
            View your campaigns
          </Link>
          .
        </p>
        <p className="text-xs text-muted-foreground">
          <Link href="/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>
          {" · "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/refund-policy" className="underline underline-offset-4">
            Refund Policy
          </Link>
        </p>
      </section>
    </div>
  );
}
