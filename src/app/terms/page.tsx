import type { Metadata } from "next";
import Link from "next/link";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { GET_LISTED_DISCLOSURES } from "@/lib/get-listed";
import { LegalPage, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply to GOATBOARD and the Get Listed distribution service.",
};

export default function TermsPage() {
  return (
    <div className="on-backdrop mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />
      <LegalPage title="Terms of Service">
        <Section title="1. What GOATBOARD is">
          <p>
            GOATBOARD is a public billboard where anyone can publish a campaign, collect free daily
            votes, and buy Power to climb the ranking. Get Listed is a separate paid service in
            which GOATBOARD submits your startup to third-party directories, communities and
            discovery platforms on your behalf.
          </p>
        </Section>

        <Section title="2. The Get Listed service">
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {GET_LISTED_DISCLOSURES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Section>

        <Section title="3. What we do not promise">
          <p>
            We do not promise that any particular directory will list you, that a listing will
            remain live, or that being listed will produce traffic, customers, search rankings, or
            backlinks. Directories are independent third parties and make their own decisions on
            their own timelines.
          </p>
        </Section>

        <Section title="4. Your content and your responsibilities">
          <p>
            You confirm that you have the right to submit the startup information you give us, that
            it is accurate, and that publishing it does not infringe anyone else&apos;s rights. We
            may decline or stop work on a campaign that is unlawful, misleading, or that directories
            are likely to reject on those grounds.
          </p>
        </Section>

        <Section title="5. Accounts and identity">
          <p>
            GOATBOARD has no login. Your campaigns are associated with an anonymous identifier
            stored in your browser. If you clear your browser data or switch browser or device, you
            may lose access to campaigns created earlier. Keep your campaign links if you need them.
          </p>
        </Section>

        <Section title="6. Payment">
          <p>
            Payments are processed by Lemon Squeezy. We do not receive or store your card details.
            Prices are shown before payment and charged once. A campaign begins only after our
            payment provider confirms the payment.
          </p>
        </Section>

        <Section title="7. Refunds">
          <p>
            Refunds and cancellations are covered by the{" "}
            <Link href="/refund-policy" className="underline underline-offset-4">
              Refund Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="8. Changes">
          <p>
            We may change these terms. The version shown on this page at the time you buy is the one
            that applies to that purchase.
          </p>
        </Section>
      </LegalPage>
    </div>
  );
}
