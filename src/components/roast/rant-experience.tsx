"use client";

import Link from "next/link";
import {
  AtSign,
  ArrowRight,
  BadgeCheck,
  Check,
  Flame,
  Loader2,
  MessageCircle,
  PackageCheck,
  PackageSearch,
  Plus,
  Reply,
  Repeat2,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { XHandleLink } from "@/components/campaign/x-handle-link";
import { GoatRantCheckoutDialog } from "@/components/roast/goat-rant-checkout-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RANT_CATEGORIES,
  type PublicRant,
  type PublicRantReply,
  type RantProduct,
} from "@/lib/rants";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All topics", ...RANT_CATEGORIES];

function formatReplyDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}

function mergeProducts(current: RantProduct[], incoming: RantProduct[]): RantProduct[] {
  const products = new Map(current.map((product) => [product.id, product]));
  for (const product of incoming) products.set(product.id, product);
  return [...products.values()];
}

function SuggestedProductCard({ product }: { product: RantProduct }) {
  return (
    <Link
      href={product.href}
      className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 transition-colors hover:border-emerald-300"
    >
      <CampaignAvatar src={product.imageUrl} name={product.name} className="size-9 rounded-lg" />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-emerald-700">Suggested product</span>
        <span className="block truncate text-sm font-black text-black">{product.name}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-emerald-700" />
    </Link>
  );
}

export function RantExperience({
  initialRants,
  initialPurchaseContext,
  ownedProducts,
}: {
  initialRants: PublicRant[];
  initialPurchaseContext: PublicRant | null;
  ownedProducts: RantProduct[];
}) {
  const [rants, setRants] = useState(initialRants);
  const [category, setCategory] = useState("All topics");
  const [sort, setSort] = useState<"top" | "recent">("top");
  const [postOpen, setPostOpen] = useState(false);
  const [solveRant, setSolveRant] = useState<PublicRant | null>(null);
  const [selectedProductId, setSelectedProductId] = useState(ownedProducts[0]?.id ?? "");
  const [newRant, setNewRant] = useState("");
  const [newCategory, setNewCategory] = useState("Product");
  const [purchaseContext, setPurchaseContext] = useState<PublicRant | null>(initialPurchaseContext);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [threadRant, setThreadRant] = useState<PublicRant | null>(null);
  const [threadReplies, setThreadReplies] = useState<PublicRantReply[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyPending, setReplyPending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<PublicRantReply | null>(null);
  const [replyXHandle, setReplyXHandle] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<RantProduct[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [productSearchAttempted, setProductSearchAttempted] = useState(false);
  const [suggestedProduct, setSuggestedProduct] = useState<RantProduct | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizedReplyXHandle = replyXHandle.trim().replace(/^@/, "");
  const replyXHandleIsValid = /^[A-Za-z0-9_]{1,15}$/.test(normalizedReplyXHandle);

  const visibleRants = useMemo(() => {
    const filtered = category === "All topics" ? rants : rants.filter((rant) => rant.category === category);
    return [...filtered].sort((a, b) =>
      sort === "top"
        ? b.sameCount - a.sameCount
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [category, rants, sort]);

  function toggleSame(rantId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/rants/${rantId}/same`, { method: "POST" });
      const payload = (await response.json().catch(() => null)) as
        | { didSame?: boolean; sameCount?: number; message?: string }
        | null;
      if (!response.ok || typeof payload?.sameCount !== "number") {
        toast.error(payload?.message ?? "Couldn't update your reaction.");
        return;
      }
      setRants((current) =>
        current.map((rant) =>
          rant.id === rantId
            ? { ...rant, sameCount: payload.sameCount!, didSame: Boolean(payload.didSame) }
            : rant,
        ),
      );
    });
  }

  function submitRant() {
    const body = newRant.trim();
    if (body.length < 12) {
      toast.error("Tell us a little more about the problem.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/rants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, category: newCategory }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { rant?: PublicRant; message?: string }
        | null;
      if (!response.ok || !payload?.rant) {
        toast.error(payload?.message ?? "Couldn't post your rant.");
        return;
      }
      setRants((current) => [payload.rant!, ...current]);
      setNewRant("");
      setPostOpen(false);
      setSort("recent");
      toast.success("Your rant is on the board.");
    });
  }

  function attachProduct() {
    if (!solveRant || !selectedProductId) return;
    const product = ownedProducts.find((item) => item.id === selectedProductId);
    if (!product) return;

    startTransition(async () => {
      const response = await fetch(`/api/rants/${solveRant.id}/solutions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaignId: product.id }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { product?: RantProduct; message?: string }
        | null;
      if (!response.ok || !payload?.product) {
        toast.error(payload?.message ?? "Couldn't connect that product.");
        return;
      }
      setRants((current) =>
        current.map((rant) =>
          rant.id === solveRant.id && !rant.products.some((item) => item.id === payload.product!.id)
            ? { ...rant, products: [...rant.products, payload.product!] }
            : rant,
        ),
      );
      setSolveRant(null);
      toast.success(`${product.name} now appears under this problem.`);
    });
  }

  function chooseForRoast(rant: PublicRant) {
    setPurchaseContext(rant);
    window.history.replaceState(null, "", `/roast?rant=${encodeURIComponent(rant.id)}`);
    setCheckoutOpen(true);
  }

  async function openReplyThread(rant: PublicRant) {
    setThreadRant(rant);
    setThreadReplies([]);
    setReplyText("");
    setReplyXHandle("");
    setReplyingTo(null);
    setProductSearchOpen(false);
    setProductQuery("");
    setProductResults([]);
    setProductSearchAttempted(false);
    setSuggestedProduct(null);
    setThreadLoading(true);

    const response = await fetch(`/api/rants/${rant.id}/replies`);
    const payload = (await response.json().catch(() => null)) as
      | { replies?: PublicRantReply[]; message?: string }
      | null;
    setThreadLoading(false);
    if (!response.ok || !payload?.replies) {
      toast.error(payload?.message ?? "Couldn't load the replies.");
      return;
    }
    setThreadReplies(payload.replies);
    const productsFromReplies = payload.replies.flatMap((reply) =>
      reply.suggestedProduct ? [reply.suggestedProduct] : [],
    );
    if (productsFromReplies.length > 0) {
      setRants((current) =>
        current.map((item) =>
          item.id === rant.id
            ? {
                ...item,
                products: mergeProducts(item.products, productsFromReplies),
              }
            : item,
        ),
      );
      setThreadRant((current) =>
        current
          ? {
              ...current,
              products: mergeProducts(current.products, productsFromReplies),
            }
          : current,
      );
    }
  }

  async function submitReply() {
    if (!threadRant) return;
    const body = replyText.trim();
    if (!body) {
      toast.error("Write a reply first.");
      return;
    }
    if (!replyXHandleIsValid) {
      toast.error("Enter a valid X handle before replying.");
      return;
    }

    setReplyPending(true);
    const response = await fetch(`/api/rants/${threadRant.id}/replies`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorXHandle: normalizedReplyXHandle,
        body,
        parentId: replyingTo?.id ?? null,
        suggestedCampaignId: suggestedProduct?.id ?? null,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { reply?: PublicRantReply; replyCount?: number | null; message?: string }
      | null;
    setReplyPending(false);
    if (!response.ok || !payload?.reply) {
      toast.error(payload?.message ?? "Couldn't post your reply.");
      return;
    }

    setThreadReplies((current) => [...current, payload.reply!]);
    setReplyText("");
    setReplyingTo(null);
    setProductSearchOpen(false);
    setProductQuery("");
    setProductResults([]);
    setProductSearchAttempted(false);
    setSuggestedProduct(null);
    setRants((current) =>
      current.map((rant) =>
        rant.id === threadRant.id
          ? {
              ...rant,
              replies: payload.replyCount ?? rant.replies + 1,
              products: payload.reply!.suggestedProduct
                ? mergeProducts(rant.products, [payload.reply!.suggestedProduct])
                : rant.products,
            }
          : rant,
      ),
    );
    setThreadRant((current) =>
      current
        ? {
            ...current,
            replies: payload.replyCount ?? current.replies + 1,
            products: payload.reply!.suggestedProduct
              ? mergeProducts(current.products, [payload.reply!.suggestedProduct])
              : current.products,
          }
        : current,
    );
    toast.success("Reply posted.");
  }

  async function searchProducts() {
    const query = productQuery.trim();
    if (query.length < 2) {
      toast.error("Enter at least two characters to search products.");
      return;
    }

    setProductSearching(true);
    setProductSearchAttempted(false);
    const response = await fetch(`/api/rants/products?query=${encodeURIComponent(query)}`);
    const payload = (await response.json().catch(() => null)) as
      | { products?: RantProduct[]; message?: string }
      | null;
    setProductSearching(false);
    if (!response.ok || !payload?.products) {
      toast.error(payload?.message ?? "Couldn't search products.");
      return;
    }
    setProductResults(payload.products);
    setProductSearchAttempted(true);
  }

  const topLevelReplies = threadReplies.filter((reply) => !reply.parentId);

  return (
    <>
      <section id="rant-board" className="scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-black/15 bg-white p-4 shadow-[0_18px_45px_-38px_rgba(0,0,0,0.45)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#ffd6d2] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.13em]">
                <Flame className="size-3.5 fill-[#ff5b4d] text-[#ff5b4d]" aria-hidden />
                The Rant Board
              </span>
              <h2 className="mt-3 text-3xl font-black leading-none tracking-[-0.045em] sm:text-5xl">
                What product do you wish existed?
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground sm:text-base">
                No product pitches. Tell us about the problem that keeps wasting your time.
              </p>
            </div>

            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-full px-5">
                  <Plus className="size-4" /> Post a rant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Put the problem on the board</DialogTitle>
                  <DialogDescription>
                    Describe a repeated frustration. Product pitches and personal attacks do not belong here.
                  </DialogDescription>
                </DialogHeader>
                <label className="text-sm font-bold" htmlFor="rant-body">Your rant</label>
                <textarea
                  id="rant-body"
                  value={newRant}
                  maxLength={180}
                  onChange={(event) => setNewRant(event.target.value)}
                  placeholder="Why does every tool make me..."
                  className="min-h-28 resize-none rounded-xl border border-black/15 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#ff6a5d]/35"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Focus on the problem, not a person.</span>
                  <span>{newRant.length}/180</span>
                </div>
                <label className="text-sm font-bold" htmlFor="rant-category">Category</label>
                <select
                  id="rant-category"
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  className="h-10 rounded-xl border border-black/15 bg-white px-3 text-sm"
                >
                  {CATEGORIES.slice(1).map((item) => <option key={item}>{item}</option>)}
                </select>
                <Button onClick={submitRant} disabled={isPending} className="mt-1 rounded-full">
                  {isPending ? "Posting..." : "Post problem"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="pretty-scroll flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                    category === item ? "border-black bg-black text-white" : "border-black/10 bg-[#f6f7f8] hover:bg-black/5",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex rounded-full bg-[#f1f2f4] p-1">
              {(["top", "recent"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSort(item)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-bold capitalize",
                    sort === item && "bg-black text-white",
                  )}
                >
                  {item} rants
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {visibleRants.map((rant) => {
              return (
                <article key={rant.id} className="group flex min-h-56 flex-col rounded-2xl border border-black/10 bg-[#fffdf9] p-4 transition-colors hover:border-[#ff6a5d]/45">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ffe6b6]">
                      <MessageCircle className="size-4 text-black" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-snug">“{rant.body}”</p>
                      <span className="mt-2 inline-flex rounded-full bg-[#e9eef3] px-2.5 py-1 text-[10px] font-bold text-slate-600">
                        {rant.category}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-inset ring-black/5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                        Products solving this problem
                      </p>
                      {ownedProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductId(ownedProducts[0]?.id ?? "");
                            setSolveRant(rant);
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-[#dff7e9] px-2.5 py-1 text-[10px] font-black text-emerald-800 hover:bg-[#c8f0da]"
                        >
                          <BadgeCheck className="size-3" /> I solve this
                        </button>
                      )}
                    </div>
                    {rant.products.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {rant.products.map((product) => {
                          const productContent = (
                            <>
                              <CampaignAvatar src={product.imageUrl} name={product.name} className="size-6 rounded-md" />
                              {product.name}
                            </>
                          );

                          return product.href ? (
                            <Link key={product.id} href={product.href} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white py-1.5 pl-1.5 pr-2.5 text-xs font-bold hover:border-black/25">
                              {productContent}
                            </Link>
                          ) : (
                            <span key={product.id} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white py-1.5 pl-1.5 pr-2.5 text-xs font-bold">
                              {productContent}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">No product has claimed this problem yet.</p>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                    <button
                      type="button"
                      aria-pressed={rant.didSame}
                      disabled={isPending}
                      onClick={() => toggleSame(rant.id)}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-black transition-colors",
                        rant.didSame ? "bg-[#ff5f50] text-white" : "bg-[#ffe2de] text-[#d73a2c] hover:bg-[#ffd3ce]",
                      )}
                    >
                      <Repeat2 className="size-3.5" /> {rant.sameCount} SAME
                    </button>
                    <button
                      type="button"
                      onClick={() => void openReplyThread(rant)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-black/5 hover:text-black"
                    >
                      <MessageCircle className="size-3.5" /> {rant.replies} replies
                    </button>
                    {rant.sameCount >= 40 && (
                      <button
                        type="button"
                        onClick={() => chooseForRoast(rant)}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#ffd8d4] px-3 py-2 text-[11px] font-black text-black hover:bg-[#ffc9c3]"
                      >
                        Turn this rant into a GOAT Rant <ArrowRight className="size-3.5" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {visibleRants.length === 0 && (
            <div className="mt-4 flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-[#fffdf9] px-6 text-center">
              <MessageCircle className="size-9 text-[#ff6a5d]" aria-hidden />
              <h3 className="mt-3 text-xl font-black">
                {rants.length === 0 ? "The board is ready for its first real rant." : "No rants in this topic yet."}
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Share a repeated product problem. New posts will appear here for everyone, not just in this browser.
              </p>
              <Button onClick={() => setPostOpen(true)} className="mt-4 rounded-full">
                <Plus className="size-4" /> Post the first problem
              </Button>
            </div>
          )}

          {ownedProducts.length === 0 && (
            <p className="mt-4 rounded-xl bg-[#f6f3ed] px-4 py-3 text-xs font-semibold text-muted-foreground">
              Founders can connect products they own in this browser. <Link href="/create" className="font-black text-black underline underline-offset-2">List your product first.</Link>
            </p>
          )}
        </div>
      </section>

      <Dialog open={Boolean(solveRant)} onOpenChange={(open) => !open && setSolveRant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect your product</DialogTitle>
            <DialogDescription>
              Choose one of your existing GoatBoard campaigns. It will appear as a product solving this problem.
            </DialogDescription>
          </DialogHeader>
          <select
            value={selectedProductId}
            onChange={(event) => setSelectedProductId(event.target.value)}
            className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm"
          >
            {ownedProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          <Button onClick={attachProduct} disabled={isPending || !selectedProductId} className="rounded-full">
            <PackageCheck className="size-4" /> Add product
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(threadRant)}
        onOpenChange={(open) => {
          if (!open) {
            setThreadRant(null);
            setThreadReplies([]);
            setReplyText("");
            setReplyXHandle("");
            setReplyingTo(null);
            setProductSearchOpen(false);
            setProductQuery("");
            setProductResults([]);
            setProductSearchAttempted(false);
            setSuggestedProduct(null);
          }
        }}
      >
        <DialogContent className="max-h-[min(48rem,calc(100vh-2rem))] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0">
          <div className="border-b border-black/10 p-5 pr-12 sm:p-6 sm:pr-14">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-[-0.035em]">Rant replies</DialogTitle>
              <DialogDescription>Discuss the problem and keep the conversation useful.</DialogDescription>
            </DialogHeader>
            {threadRant && (
              <div className="mt-4 rounded-2xl bg-[#fff0ee] p-4 ring-1 ring-inset ring-[#ff8b81]/25">
                <p className="text-sm font-bold leading-relaxed">“{threadRant.body}”</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#d73a2c]">
                  {threadRant.replies} {threadRant.replies === 1 ? "reply" : "replies"}
                </p>
              </div>
            )}
          </div>

          <div className="min-h-0 overflow-y-auto px-5 py-4 sm:px-6">
            {threadLoading ? (
              <div className="flex min-h-40 items-center justify-center text-sm font-semibold text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" /> Loading replies
              </div>
            ) : topLevelReplies.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <MessageCircle className="size-8 text-[#ff6a5d]" />
                <p className="mt-3 font-black">No replies yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">Start the conversation with something useful.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topLevelReplies.map((reply) => {
                  const children = threadReplies.filter((item) => item.parentId === reply.id);
                  return (
                    <article key={reply.id} className="rounded-2xl border border-black/10 bg-[#fffdf9] p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-full bg-[#ffe6b6]">
                          <UserRound className="size-3.5" />
                        </span>
                        {reply.isMine && <p className="text-xs font-black">You</p>}
                        {reply.authorXHandle ? (
                          <XHandleLink handle={reply.authorXHandle} className="text-xs font-black text-black" />
                        ) : (
                          <p className="text-xs font-black">Community member</p>
                        )}
                        <span className="text-[11px] text-muted-foreground">{formatReplyDate(reply.createdAt)}</span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{reply.body}</p>
                      {reply.suggestedProduct && <SuggestedProductCard product={reply.suggestedProduct} />}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(reply);
                          window.setTimeout(() => document.getElementById("rant-reply-body")?.focus(), 0);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-muted-foreground hover:text-black"
                      >
                        <Reply className="size-3.5" /> Reply
                      </button>

                      {children.length > 0 && (
                        <div className="mt-4 space-y-3 border-l-2 border-[#ffd0cb] pl-3 sm:pl-4">
                          {children.map((child) => (
                            <div key={child.id} className="rounded-xl bg-white p-3 ring-1 ring-inset ring-black/5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex size-6 items-center justify-center rounded-full bg-[#eef1f4]">
                                  <UserRound className="size-3" />
                                </span>
                                {child.isMine && <p className="text-xs font-black">You</p>}
                                {child.authorXHandle ? (
                                  <XHandleLink handle={child.authorXHandle} className="text-xs font-black text-black" />
                                ) : (
                                  <p className="text-xs font-black">Community member</p>
                                )}
                                <span className="text-[11px] text-muted-foreground">{formatReplyDate(child.createdAt)}</span>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{child.body}</p>
                              {child.suggestedProduct && <SuggestedProductCard product={child.suggestedProduct} />}
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingTo(child);
                                  window.setTimeout(() => document.getElementById("rant-reply-body")?.focus(), 0);
                                }}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-muted-foreground hover:text-black"
                              >
                                <Reply className="size-3.5" /> Reply to thread
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-black/10 bg-white p-4 sm:p-5">
            {replyingTo && (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-[#fff0ee] px-3 py-2 text-xs">
                <span className="font-bold">Replying to {replyingTo.isMine ? "your comment" : "a community member"}</span>
                <button type="button" onClick={() => setReplyingTo(null)} className="font-black text-[#d73a2c]">Cancel</button>
              </div>
            )}
            <div>
              <label htmlFor="rant-reply-x" className="mb-1.5 block text-xs font-black">Your X account</label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="rant-reply-x"
                  value={replyXHandle}
                  maxLength={16}
                  onChange={(event) => setReplyXHandle(event.target.value)}
                  placeholder="yourhandle"
                  autoComplete="off"
                  className={cn(
                    "h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#ff6a5d]/35",
                    replyXHandle.length > 0 && !replyXHandleIsValid ? "border-red-400" : "border-black/15",
                  )}
                />
              </div>
              <p className={cn("mt-1 text-[11px]", replyXHandle.length > 0 && !replyXHandleIsValid ? "text-red-600" : "text-muted-foreground")}>
                {replyXHandle.length > 0 && !replyXHandleIsValid
                  ? "Enter a valid X handle with up to 15 letters, numbers, or underscores."
                  : "Required so people know who is joining the discussion."}
              </p>
            </div>

            <label htmlFor="rant-reply-body" className="sr-only">Write a reply</label>
            <textarea
              id="rant-reply-body"
              value={replyText}
              maxLength={500}
              disabled={!replyXHandleIsValid}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder={
                !replyXHandleIsValid
                  ? "Enter your X handle before writing a reply."
                  : replyingTo
                    ? "Write your response..."
                    : "Add a useful reply..."
              }
              className="mt-3 min-h-20 w-full resize-none rounded-xl border border-black/15 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#ff6a5d]/35 disabled:cursor-not-allowed disabled:bg-black/[0.03]"
            />

            {suggestedProduct ? (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
                <CampaignAvatar src={suggestedProduct.imageUrl} name={suggestedProduct.name} className="size-9 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-emerald-700">Product attached</span>
                  <span className="block truncate text-sm font-black">{suggestedProduct.name}</span>
                </span>
                <button
                  type="button"
                  aria-label="Remove suggested product"
                  onClick={() => setSuggestedProduct(null)}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setProductSearchOpen((open) => !open)}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 hover:text-emerald-900"
                >
                  <PackageSearch className="size-4" /> Suggest an existing GoatBoard product
                </button>
                {productSearchOpen && (
                  <div className="mt-2 rounded-xl border border-black/10 bg-[#f8f8f6] p-2.5">
                    <div className="flex gap-2">
                      <input
                        value={productQuery}
                        onChange={(event) => {
                          setProductQuery(event.target.value);
                          setProductSearchAttempted(false);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void searchProducts();
                          }
                        }}
                        placeholder="Search listed products"
                        className="h-9 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/25"
                      />
                      <Button type="button" size="sm" onClick={() => void searchProducts()} disabled={productSearching} className="rounded-lg">
                        {productSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                        <span className="sr-only">Search products</span>
                      </Button>
                    </div>
                    {productResults.length > 0 ? (
                      <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
                        {productResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              setSuggestedProduct(product);
                              setProductSearchOpen(false);
                              setProductResults([]);
                              setProductSearchAttempted(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg bg-white p-2 text-left hover:bg-emerald-50"
                          >
                            <CampaignAvatar src={product.imageUrl} name={product.name} className="size-7 rounded-md" />
                            <span className="min-w-0 flex-1 truncate text-xs font-black">{product.name}</span>
                            <Plus className="size-3.5 text-emerald-700" />
                          </button>
                        ))}
                      </div>
                    ) : productSearchAttempted && !productSearching ? (
                      <p className="mt-2 px-1 text-xs text-muted-foreground">No matching GoatBoard products found.</p>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{replyText.length}/500</span>
              <Button
                onClick={() => void submitReply()}
                disabled={replyPending || threadLoading || !replyXHandleIsValid || replyText.trim().length === 0}
                className="rounded-full px-5"
              >
                {replyPending ? <Loader2 className="size-4 animate-spin" /> : <Reply className="size-4" />}
                {replyPending ? "Posting..." : "Post reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <section id="purchase" className="scroll-mt-24 px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-[2rem] border border-[#ff8b81]/35 bg-[#fff0ee] p-6 sm:p-8 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#ffd0cb] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.13em]">
              <Flame className="size-3.5 fill-[#ff5b4d] text-[#ff5b4d]" /> GOAT Rant
            </span>
            <h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl">
              Let me make some noise about your product.
            </h2>
            <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-muted-foreground">
              Turn audience pain into a sharp, funny promotional video that reveals your product as the answer.
            </p>
            {purchaseContext && (
              <div className="mt-5 rounded-2xl border border-[#ff8b81]/35 bg-white/75 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#d73a2c]">Selected audience problem</p>
                <p className="mt-1 text-sm font-bold">“{purchaseContext.body}”</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#ff6a5d] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em]"><Flame className="size-3.5 text-[#ff5b4d]" /> GOAT Rant</p>
                <p className="mt-1 text-4xl font-black">$149</p>
              </div>
              <span className="rounded-full bg-[#ffd8d4] px-3 py-1 text-[10px] font-black uppercase">Promotional video</span>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm font-semibold text-muted-foreground">
              {["Custom promotional roast script", "60 to 120 second edited video", "Your product positioned as the solution", "Final video delivered to you", "Featured placement on GoatBoard"].map((item) => (
                <li key={item} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-black" /> {item}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-black text-white hover:opacity-85"
            >
              Start my GOAT Rant <ArrowRight className="size-4" />
            </button>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-black" /> We roast frustrating patterns and problems, never protected characteristics or individual users.
            </p>
          </div>
        </div>
      </section>

      <GoatRantCheckoutDialog
        rant={purchaseContext ? { id: purchaseContext.id, body: purchaseContext.body } : null}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        trigger={null}
      />
    </>
  );
}
