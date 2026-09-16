"use client";

import * as React from "react";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { COMMENT_MAX } from "@/lib/validation";
import type { CampaignComment } from "@/lib/types";

/** "3h ago" - comments are recent enough that a date would be noise. */
function ago(iso: string, now: number): string {
  const s = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/**
 * Comments on a campaign, shown wherever the campaign card opens.
 *
 * Seeded from the server so the list is there on first paint, then kept in
 * local state - a new comment is appended rather than refetched, so the
 * author sees their own words immediately.
 *
 * Timestamps render blank until mount: they are relative to now, and the
 * server's "now" is already stale by the time the HTML arrives.
 */
export function CampaignComments({
  campaignId,
  initialComments,
}: {
  campaignId: string;
  initialComments: CampaignComment[];
}) {
  const [comments, setComments] = React.useState(initialComments);
  const [body, setBody] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  // Null until the browser takes over, which is also what keeps these
  // relative timestamps out of the server render - "3h ago" computed there is
  // already wrong by the time the HTML lands.
  const now = useNow();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || posting) return;

    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Couldn't post your comment.");
        return;
      }
      setComments((prev) => [data.comment as CampaignComment, ...prev]);
      setBody("");
    } catch {
      toast.error("Couldn't post your comment. Try again.");
    } finally {
      setPosting(false);
    }
  }

  const remaining = COMMENT_MAX - body.length;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <MessageCircle className="size-3.5" />
        {comments.length === 0
          ? "Comments"
          : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
      </h2>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, COMMENT_MAX))}
          placeholder="What do you think of this one?"
          rows={2}
          className="resize-none"
          aria-label="Write a comment"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground">
            {body.length > 0 && `${remaining} left`}
          </span>
          <Button type="submit" size="sm" disabled={posting || body.trim().length === 0}>
            {posting ? "Posting…" : "Post"} <Send className="size-3.5" />
          </Button>
        </div>
      </form>

      {comments.length > 0 && (
        <ul className="flex flex-col divide-y divide-border">
          {comments.map((c) => (
            <li key={c.id} className="flex flex-col gap-1 py-2.5">
              <p className="wrap-break-word text-sm">{c.body}</p>
              <span className="text-[11px] text-muted-foreground">
                {now === null ? "" : ago(c.created_at, now)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
