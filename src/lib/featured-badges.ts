export type FeaturedBadge = {
  name: string;
  href: string;
  src: string;
  alt?: string;
  width?: number;
  height: number;
  rel?: string;
};

/** Directory badges shown in the homepage's continuously moving feature strip. */
export const FEATURED_BADGES: FeaturedBadge[] = [
  {
    name: "Nick Launches",
    href: "https://nicklaunches.com/products/goatboard/?utm_source=goatboard.lol&utm_medium=badge&utm_campaign=featured",
    src: "https://nicklaunches.com/badges/featured-dark.png",
    width: 244,
    height: 56,
  },
  {
    name: "Indie Chains",
    href: "https://indiechains.com",
    src: "https://api.indiechains.com/badge/7304bc433fcf589d5a3283e9c4be846d0dfe4f5594a6ce3a.svg?theme=dark",
    width: 180,
    height: 40,
  },
  {
    name: "UdonBoost",
    href: "https://udonboost.com/",
    src: "https://udonboost.com/badges/featured-partner.png",
    alt: "UdonBoost Featured Partner",
    width: 183,
    height: 54,
    rel: "noopener noreferrer",
  },
  {
    name: "PostYourStartup",
    href: "https://postyourstartup.co/startup/goatboard?ref=badge",
    src: "https://postyourstartup.co/api/badge/goatboard?theme=light",
    alt: "Featured on PostYourStartup",
    width: 212,
    height: 55,
    rel: "noopener noreferrer",
  },
  {
    name: "AI X Collection",
    href: "https://aixcollection.com/ai/goatboard",
    src: "https://aixcollection.com/assets/images/badge-dark.png",
    alt: "AI X Collection",
    height: 54,
    rel: "noopener noreferrer",
  },
  {
    name: "App Hub List",
    href: "https://apphublist.com/products/goatboard",
    src: "https://apphublist.com/assets/images/badge.png",
    alt: "App Hub List",
    height: 54,
    rel: "noopener noreferrer",
  },
];
