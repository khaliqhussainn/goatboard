import { pickMascot } from "@/lib/mascots";
import { cn } from "@/lib/utils";

const HERO_BG_COLORS = [
  "bg-hero-red",
  "bg-hero-yellow",
  "bg-hero-blue",
  "bg-hero-green",
  "bg-hero-purple",
  "bg-hero-orange",
  "bg-hero-teal",
  "bg-hero-pink",
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * The big image area on the spotlight and #2/#3 tiles: a bright flat color
 * with the campaign's mascot front and center. Seeded on campaign id *and*
 * rank together (not just id), so a campaign gets a new mascot pose and a
 * new background color the moment it moves into a different rank slot —
 * e.g. climbing from #4 into the #3 tile — instead of carrying the same
 * look up the board with it.
 */
export function CampaignHeroMascot({
  campaignId,
  rank,
  className,
}: {
  campaignId: string;
  rank: number;
  className?: string;
}) {
  const seed = `${campaignId}-${rank}`;
  const bg = HERO_BG_COLORS[hashSeed(seed) % HERO_BG_COLORS.length];
  const mascot = pickMascot(seed);

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", bg, className)}>
      {mascot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mascot} alt="" className="size-[80%] object-contain drop-shadow-lg" />
      )}
    </div>
  );
}
