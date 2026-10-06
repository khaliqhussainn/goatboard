export const UI_REVIEW_PLAN_KEYS = ["landing", "product", "design"] as const;

export type UiReviewPlanKey = (typeof UI_REVIEW_PLAN_KEYS)[number];

export const UI_REVIEW_PLANS: Record<
  UiReviewPlanKey,
  { name: string; priceUsd: number; variantEnvVar: string }
> = {
  landing: {
    name: "Landing Page Review",
    priceUsd: 49,
    variantEnvVar: "LEMONSQUEEZY_UI_REVIEW_LANDING_VARIANT_ID",
  },
  product: {
    name: "Full Product Review",
    priceUsd: 99,
    variantEnvVar: "LEMONSQUEEZY_UI_REVIEW_PRODUCT_VARIANT_ID",
  },
  design: {
    name: "Review + Design Suggestions",
    priceUsd: 149,
    variantEnvVar: "LEMONSQUEEZY_UI_REVIEW_DESIGN_VARIANT_ID",
  },
};

export function isUiReviewPlanKey(value: string): value is UiReviewPlanKey {
  return UI_REVIEW_PLAN_KEYS.includes(value as UiReviewPlanKey);
}
