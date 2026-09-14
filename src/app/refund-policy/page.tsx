import type { Metadata } from "next";
import Link from "next/link";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { LegalPage, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "When Get Listed campaigns and GOATBOARD purchases can be refunded.",
};

export default function RefundPolicyPage() {
  return (
    <div className="on-backdrop mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />
      <LegalPage title="Refund Policy">
        <Section title="Get Listed campaigns">
          <p>
            Get Listed is a service delivered by hand over time, so refunds depend on how much work
            has already happened:
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong>Before any submission has been made</strong> - full refund on request.
            </li>
            <li>
              <strong>While submissions are in progress</strong> - a partial refund covering the
              submissions not yet made. Your campaign page shows exactly how many have been sent.
            </li>
            <li>
              <strong>Once the campaign is marked complete</strong> - the service has been
              delivered and payment is non-refundable.
            </li>
          </ul>
        </Section>

        <Section title="Rejections are not grounds for a refund">
          <p>
            Directories decide independently whether to list a startup, and rejections are a normal
            part of distribution. A submission that was made and rejected still counts as delivered.
            What you are buying is the submission work, not a guaranteed listing.
          </p>
        </Section>

        <Section title="If we cannot deliver">
          <p>
            If we cannot complete the submissions in your package - for example because your startup
            does not meet the requirements of enough relevant directories - we will refund the
            undelivered portion.
          </p>
        </Section>

        <Section title="Billboard votes and Power">
          <p>
            Power bought to boost a billboard campaign is applied immediately and permanently, and
            is non-refundable. Ad slot rentals are non-refundable once the slot has started running;
            a slot that has not yet started can be cancelled for a full refund.
          </p>
        </Section>

        <Section title="How to request a refund">
          <p>
            Contact us with your campaign link and the reason. Refunds are issued through Lemon
            Squeezy to the original payment method. See also the{" "}
            <Link href="/terms" className="underline underline-offset-4">
              Terms of Service
            </Link>
            .
          </p>
        </Section>
      </LegalPage>
    </div>
  );
}
