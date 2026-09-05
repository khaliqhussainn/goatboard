import type { Category } from "@/lib/types";

type BadgeAccent = "pink" | "yellow" | "purple" | "blue" | "green";

export const CATEGORIES: { value: Category; label: string; accent: BadgeAccent }[] = [
  { value: "product", label: "Product", accent: "blue" },
  { value: "startup", label: "Startup", accent: "purple" },
  { value: "website", label: "Website", accent: "green" },
  { value: "app", label: "App", accent: "blue" },
  { value: "creator", label: "Creator", accent: "pink" },
  { value: "music", label: "Music", accent: "purple" },
  { value: "meme", label: "Meme", accent: "yellow" },
  { value: "cause", label: "Cause", accent: "green" },
  { value: "game", label: "Game", accent: "pink" },
  { value: "other", label: "Other", accent: "yellow" },
];

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Other";
}

export function categoryAccent(value: string): BadgeAccent {
  return CATEGORIES.find((c) => c.value === value)?.accent ?? "yellow";
}
