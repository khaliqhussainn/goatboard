export const RANT_CATEGORIES = [
  "Analytics",
  "Design",
  "Distribution",
  "Growth",
  "Product",
  "Security",
  "Other",
] as const;

export type RantCategory = (typeof RANT_CATEGORIES)[number];

export type RantProduct = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  href: string;
};

export type PublicRant = {
  id: string;
  body: string;
  category: RantCategory;
  sameCount: number;
  replies: number;
  didSame: boolean;
  products: RantProduct[];
  createdAt: string;
};

export type PublicRantReply = {
  id: string;
  parentId: string | null;
  body: string;
  isMine: boolean;
  createdAt: string;
};
