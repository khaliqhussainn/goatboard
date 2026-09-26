import type { Metadata } from "next";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { LegalPage, Section } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What GOATBOARD collects, why, and who it is shared with.",
};

export default function PrivacyPage() {
  return (
    <div className="on-backdrop mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />
      <LegalPage title="Privacy Policy">
        <Section title="What we collect">
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong>An anonymous browser identifier.</strong> A random id stored in a cookie
              (goatboard_uid). It is what lets us limit voting to once a day per campaign and show
              you your own campaigns without a login. When you submit a campaign, it is linked to
              that campaign and its privately stored contact details so ownership can be preserved.
            </li>
            <li>
              <strong>Campaign information you enter.</strong> Startup name, website, description,
              category, pricing model, maker name, images and any links you add. Campaign and maker
              email addresses are stored privately for service communication. Startup information
              is submitted to third-party directories only as part of the Get Listed service.
            </li>
            <li>
              <strong>Visit counts.</strong> We record that a visit happened and a periodic
              &quot;still here&quot; ping for the live visitor count. These are counts, not profiles.
            </li>
            <li>
              <strong>Payment records.</strong> Order id, amount, currency and status from our
              payment provider.
            </li>
          </ul>
        </Section>

        <Section title="What we do not collect">
          <p>
            We do not collect card details - payments go through Lemon Squeezy and card data never
            reaches our servers or our database. There are no accounts, so we hold no passwords. We
            do not run third-party advertising or analytics trackers.
          </p>
        </Section>

        <Section title="Who we share it with">
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong>Third-party directories</strong>, for Get Listed campaigns - the startup
              information you gave us, submitted on your behalf.
            </li>
            <li>
              <strong>Lemon Squeezy</strong>, our payment provider, to take payment.
            </li>
            <li>
              <strong>Supabase</strong>, our database and file host.
            </li>
            <li>
              <strong>Vercel</strong>, our application host.
            </li>
          </ul>
          <p>We do not sell personal data.</p>
        </Section>

        <Section title="Public information">
          <p>
            Anything published on the GOATBOARD billboard - campaign name, description, images,
            link, maker name, pricing model and vote totals - is public by design. Campaign and maker
            email addresses are not displayed publicly. Get Listed campaign details are private to
            your browser, apart from the information submitted to directories on your behalf.
          </p>
        </Section>

        <Section title="Retention and removal">
          <p>
            Clearing your browser cookies removes your link to your campaigns but does not delete
            them from our database. To have a campaign or its data removed, contact us with the
            campaign link.
          </p>
        </Section>
      </LegalPage>
    </div>
  );
}
