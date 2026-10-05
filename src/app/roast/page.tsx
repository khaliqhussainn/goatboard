import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Eye,
  Flame,
  Lightbulb,
  MessageCircleWarning,
  PackageCheck,
  Play,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
} from "lucide-react";
import { RantExperience } from "@/components/roast/rant-experience";
import { getRants } from "@/lib/queries/rants";
import type { RantProduct } from "@/lib/rants";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";

export const metadata: Metadata = {
  title: "GOAT Rant",
  description: "Turn the problem your audience keeps complaining about into a promotional roast that positions your product as the solution.",
};

const FORMAT_STEPS = [
  {
    number: "01",
    title: "Cry",
    body: "Find the repeated problem your audience cannot stop complaining about.",
    icon: MessageCircleWarning,
    accent: "bg-[#ffe0df]",
  },
  {
    number: "02",
    title: "Roast",
    body: "A sharp script calls out the frustrating behavior around that problem.",
    icon: Flame,
    accent: "bg-[#ffe9df]",
  },
  {
    number: "03",
    title: "Reveal",
    body: "The story pivots and shows that your product already solves it.",
    icon: Eye,
    accent: "bg-[#fff4cd]",
  },
  {
    number: "04",
    title: "Solution",
    body: "The product lands as the practical answer people can try next.",
    icon: PackageCheck,
    accent: "bg-[#ddf7e8]",
  },
];

async function getOwnedProducts(): Promise<RantProduct[]> {
  const visitorId = await getVisitorId();
  if (!visitorId) return [];

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("campaigns")
      .select("id, name, slug, image_url")
      .eq("created_by", visitorId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    return (data ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.image_url,
      href: `/campaign/${product.slug}`,
    }));
  } catch (error) {
    console.error("GOAT Rant owned product lookup failed", error);
    return [];
  }
}

export default async function RoastPage({
  searchParams,
}: {
  searchParams: Promise<{ rant?: string }>;
}) {
  const visitorId = await getVisitorId();
  const selectedRantId = (await searchParams).rant;
  const [ownedProducts, initialRants] = await Promise.all([
    getOwnedProducts(),
    getRants(visitorId).catch((error) => {
      console.error("GOAT Rant board lookup failed", error);
      return [];
    }),
  ]);

  return (
    <div className="bg-[#fbfaf7] text-black">
      <section className="overflow-hidden px-4 pb-12 pt-8 sm:px-6 sm:pb-16 lg:pt-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:min-h-[540px] lg:grid-cols-[0.86fr_1.14fr] lg:items-stretch lg:gap-10">
          <div className="relative z-10 flex flex-col items-start justify-center py-2 lg:py-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#ffd0cb] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.13em]">
              <Flame className="size-3.5 fill-[#ff5b4d] text-[#ff5b4d]" aria-hidden />
              GOAT Rant
            </span>
            <h1 className="mt-4 text-5xl font-black leading-[0.91] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              They keep crying.
              <span className="mt-1 block w-fit rounded-md bg-[#ffaaa3] px-2 pb-1">
                You already built the solution.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
              I turn the problem your audience cannot stop complaining about into a brutally honest promotional roast. Then your product arrives as the solution.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#purchase" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-7 text-sm font-black text-white hover:opacity-85">
                Get your audience roasted <ArrowRight className="size-4" />
              </a>
              <a href="#rant-board" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-6 text-sm font-black hover:bg-black/5">
                Explore the Rant Board
              </a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <UsersRound className="size-4 text-black" /> Built for founders, indie teams, and products with a real problem to solve.
            </p>
          </div>

          <div aria-hidden className="relative mx-auto h-[430px] w-full max-w-[620px] sm:h-[500px] lg:h-auto lg:min-h-[540px]">
            <div className="absolute inset-x-8 inset-y-3 rounded-[3rem] bg-[#fff0e9] sm:inset-x-10 sm:inset-y-5" />
            <div className="absolute left-2 top-10 -rotate-6 rounded-xl bg-[#ffd3cf] px-4 py-3 text-sm font-black shadow-sm sm:left-6 sm:text-base">
              Why is this so hard?
            </div>
            <div className="absolute right-1 top-5 rotate-6 rounded-xl bg-[#fff0bd] px-4 py-3 text-sm font-black shadow-sm sm:right-8 sm:text-base">
              There has to be a better way.
            </div>
            <div className="absolute right-0 top-[42%] rotate-3 rounded-xl bg-[#ffd3cf] px-4 py-3 text-sm font-black shadow-sm sm:right-3 sm:text-base">
              I am tired of this loop.
            </div>
            <Sparkles className="absolute left-[12%] top-[42%] size-8 text-[#ff5b4d]" />
            <Flame className="absolute bottom-[15%] right-[12%] size-8 fill-[#ff5b4d] text-[#ff5b4d]" />
            <Image
              src="/mascots/goat-rant.png"
              alt=""
              width={2048}
              height={2048}
              loading="eager"
              className="absolute bottom-0 left-1/2 h-[82%] w-auto -translate-x-1/2 object-contain drop-shadow-[0_16px_18px_rgba(126,38,29,0.16)] sm:h-[86%] lg:h-[90%]"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">The format</p>
          <h2 className="mt-2 text-center text-3xl font-black tracking-[-0.045em] sm:text-5xl">
            Cry <ArrowRight className="mx-1 inline size-6 sm:size-8" /> Roast <ArrowRight className="mx-1 inline size-6 sm:size-8" /> Reveal <ArrowRight className="mx-1 inline size-6 sm:size-8" /> Solution
          </h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {FORMAT_STEPS.map(({ number, title, body, icon: Icon, accent }) => (
              <article key={title} className={`${accent} rounded-2xl border border-black/5 p-5`}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-white/75"><Icon className="size-5" /></span>
                  <span className="text-lg font-black">{number}</span>
                </div>
                <h3 className="mt-4 text-xl font-black">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-black/10 bg-[#fff7f3] p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
            <div className="flex flex-col">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#ffd4d0] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em]">
                <Video className="size-3.5" /> Example roast: Eagle Eye Security
              </span>
              <h2 className="mt-4 text-3xl font-black leading-[1] tracking-[-0.045em] sm:text-4xl">
                “You built an entire SaaS and secured it with hopes and prayers?”
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                A sample of how audience frustration becomes a funny, effective promotional roast.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:mt-auto">
                {[
                  { title: "The cry", body: "Getting hacked, losing accounts, and security feeling too expensive.", icon: MessageCircleWarning },
                  { title: "The roast", body: "Months of building, then production is protected by one forgotten password.", icon: Flame },
                  { title: "The solution", body: "Eagle Eye makes security simple for indie teams.", icon: ShieldCheck },
                ].map(({ title, body, icon: Icon }) => (
                  <div key={title} className="rounded-xl border border-black/5 bg-white p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em]"><Icon className="size-3.5" /> {title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-2xl bg-[#07111e] text-white sm:min-h-96">
              <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_65%_35%,#ff6254_0,transparent_26%),linear-gradient(135deg,transparent_35%,#153047_100%)]" />
              <ShieldCheck className="absolute left-8 top-8 size-16 text-white/10 sm:size-24" />
              <div className="relative z-10 text-center">
                <button type="button" aria-label="Play Eagle Eye Security example" className="mx-auto flex size-20 items-center justify-center rounded-full border border-white/80 bg-black/25 backdrop-blur-sm transition-transform hover:scale-105">
                  <Play className="ml-1 size-8 fill-white text-white" />
                </button>
                <p className="mt-5 text-sm font-black uppercase tracking-[0.18em]">Eagle Eye Security</p>
                <p className="mt-1 text-xs text-white/60">GOAT Rant example video</p>
              </div>
              <p className="absolute right-6 top-7 -rotate-6 text-right text-lg font-black leading-tight sm:text-2xl">Hopes<br />and prayers?</p>
              <span className="absolute bottom-5 right-5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">1:28</span>
            </div>
          </div>
        </div>
      </section>

      <RantExperience
        initialRants={initialRants}
        initialPurchaseContext={initialRants.find((rant) => rant.id === selectedRantId) ?? null}
        ownedProducts={ownedProducts}
      />

      <section className="px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="relative mx-auto flex min-h-64 max-w-6xl items-center overflow-hidden rounded-[2rem] bg-[#fff0d8] p-6 sm:p-10">
          <div className="relative z-10 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Ready to be heard?</p>
            <h2 className="mt-2 text-4xl font-black leading-[0.94] tracking-[-0.05em] sm:text-5xl">
              Your audience has the complaint. Your product has the answer.
            </h2>
            <a href="#purchase" className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-black text-white hover:opacity-85">
              Get roasted <ArrowRight className="size-4" />
            </a>
          </div>
          <Image src="/mascots/goat-rant.png" alt="" width={2048} height={2048} className="absolute -bottom-24 right-0 hidden h-80 w-auto sm:block" />
          <Lightbulb className="absolute right-[28%] top-8 hidden size-9 text-[#ffb61f] lg:block" />
        </div>
      </section>
    </div>
  );
}
