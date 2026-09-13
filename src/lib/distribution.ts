/**
 * Everything the distribution service page reads: packages, what's included,
 * the steps, and the sample campaign the dashboard renders.
 *
 * Kept as plain data so pricing and copy can be changed here without touching
 * a single component.
 */

/** Where the package CTAs point until checkout exists for this service.
 *  Swap for a real checkout route once the products are set up. */
export const DISTRIBUTION_CONTACT = "mailto:hello@goatboard.lol?subject=GOATBOARD%20Distribution";

export type DistributionPackage = {
  id: string;
  name: string;
  submissions: string;
  price: number;
  tagline: string;
  features: string[];
  /** Draws the highlighted treatment and the "Most popular" ribbon. */
  popular?: boolean;
  href: string;
};

export const DISTRIBUTION_PACKAGES: DistributionPackage[] = [
  {
    id: "starter",
    name: "GOAT Starter",
    submissions: "30+ submissions",
    price: 49,
    tagline: "Get the essentials covered.",
    features: [
      "30+ relevant directories",
      "GOATBOARD listing included",
      "Submission tracking",
      "Standard submission report",
    ],
    href: DISTRIBUTION_CONTACT,
  },
  {
    id: "growth",
    name: "GOAT Growth",
    submissions: "60+ submissions",
    price: 89,
    tagline: "Wider reach, more niches.",
    popular: true,
    features: [
      "60+ relevant directories",
      "Niche + vertical directories",
      "Startup & founder communities",
      "GOATBOARD listing included",
      "Detailed submission tracking",
      "Full submission report",
    ],
    href: DISTRIBUTION_CONTACT,
  },
  {
    id: "max",
    name: "GOAT Max",
    submissions: "100+ submissions",
    price: 149,
    tagline: "Every channel we cover.",
    features: [
      "100+ submissions across all channels",
      "Niche, community & launch platforms",
      "Priority processing",
      "GOATBOARD listing included",
      "Advanced tracking",
      "Full report + insights",
    ],
    href: DISTRIBUTION_CONTACT,
  },
];

/** The upsell: distribution plus a paid run at the #1 spotlight. */
export const DISTRIBUTION_BOOST = {
  name: "GOAT + Boost",
  tagline: "Distribution, plus a push up the board.",
  body: "Everything in a distribution package, bundled with Power on GOATBOARD so your campaign climbs while the submissions go out.",
  features: [
    "Any distribution package",
    "Power added to your GOATBOARD campaign",
    "Featured placement while your campaign runs",
  ],
  href: DISTRIBUTION_CONTACT,
};

export const DISTRIBUTION_INCLUDES = [
  {
    icon: "FolderSearch",
    accent: "blue",
    title: "Startup directories",
    body: "We work through the directories founders actually get discovered on, and submit you to the ones that fit.",
  },
  {
    icon: "Crosshair",
    accent: "purple",
    title: "Relevant niche directories",
    body: "Beyond the obvious lists - the smaller, vertical-specific places that match what you've actually built.",
  },
  {
    icon: "Crown",
    accent: "yellow",
    title: "GOATBOARD listing",
    body: "Your startup goes on the board as part of the process, so there's one public page you can point people at.",
  },
  {
    icon: "ListChecks",
    accent: "green",
    title: "Submission tracking",
    body: "Every submission is logged as we send it. No guessing where your startup has and hasn't been posted.",
  },
  {
    icon: "CircleCheck",
    accent: "pink",
    title: "Accepted & rejected status",
    body: "Listings get reviewed by real people and not all of them land. You see which were accepted and which weren't.",
  },
  {
    icon: "FileText",
    accent: "blue",
    title: "Complete report",
    body: "A full breakdown at the end: where you were submitted, what went live, and what's still pending.",
  },
] as const;

export const DISTRIBUTION_STEPS = [
  {
    step: "01",
    title: "Submit your startup",
    body: "Tell us what you've built and who it's for. One short form, no back and forth.",
  },
  {
    step: "02",
    title: "We distribute it",
    body: "We submit you by hand to the directories, communities and launch platforms that fit.",
  },
  {
    step: "03",
    title: "Track your results",
    body: "Watch submissions land in your report - accepted, pending and rejected, all visible.",
  },
] as const;

export type SubmissionStatus = "accepted" | "pending" | "rejected";

export type DistributionCampaign = {
  /** Shown as the campaign's label in the dashboard header. */
  reference: string;
  submitted: number;
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
  /** Where the submissions went, for the breakdown tiles. */
  channels: { label: string; count: number }[];
  recent: { name: string; status: SubmissionStatus; when: string }[];
};

/**
 * Illustrative only - this is what a campaign looks like, not anyone's real
 * numbers, and the dashboard labels it as a sample on screen. The component
 * takes a campaign as a prop, so pointing it at real data later is a matter
 * of passing a different object.
 *
 * The figures are internally consistent on purpose: accepted + pending +
 * rejected equals submitted, and the channel counts add up to the same total.
 */
export const SAMPLE_CAMPAIGN: DistributionCampaign = {
  reference: "Campaign #247",
  submitted: 64,
  total: 100,
  accepted: 41,
  pending: 18,
  rejected: 5,
  channels: [
    { label: "Niche directories", count: 27 },
    { label: "Launch platforms", count: 15 },
    { label: "Startup communities", count: 12 },
    { label: "Discovery sites", count: 10 },
  ],
  recent: [
    { name: "SaaS Hub", status: "accepted", when: "2h ago" },
    { name: "Startup List", status: "accepted", when: "4h ago" },
    { name: "Indie Founders", status: "pending", when: "6h ago" },
    { name: "Launch Board", status: "accepted", when: "8h ago" },
    { name: "AI Directory", status: "rejected", when: "12h ago" },
  ],
};
