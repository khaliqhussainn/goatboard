"use client";

import * as React from "react";
import { toast } from "sonner";
import { MessageCircle, Send, CornerDownRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XHandleLink } from "@/components/campaign/x-handle-link";
import { useNow } from "@/hooks/use-now";
import { COMMENT_MAX, COMMENT_HANDLE_MAX } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { CampaignComment } from "@/lib/types";

/** "3h ago" - comments are recent enough that a date would be noise. */
function ago(iso: string, now: number): string {
  const s = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Who to show: the required handle on anything new, the old free-text name on rows written before it existed. */
function Author({ comment }: { comment: CampaignComment }) {
  if (comment.author_x_handle) {
    return <XHandleLink handle={comment.author_x_handle} className="text-foreground" />;
  }
  if (comment.author_name) {
    return <span className="font-semibold text-foreground">{comment.author_name}</span>;
  }
  return null;
}

async function postComment(payload: {
  campaignId: string;
  authorXHandle: string;
  body: string;
  parentId?: string | null;
}): Promise<CampaignComment> {
  const res = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Couldn't post your comment.");
  return data.comment as CampaignComment;
}

/** The compose box, reused for both the top-level form and every reply form. */
function CommentForm({
  submitLabel,
  autoFocus,
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (handle: string, body: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const [handle, setHandle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [posting, setPosting] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (posting || !body.trim() || !handle.trim()) return;
    setPosting(true);
    try {
      await onSubmit(handle.trim(), body.trim());
      setBody("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't post your comment.");
    } finally {
      setPosting(false);
    }
  }

  const remaining = COMMENT_MAX - body.length;

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="relative w-40">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          @
        </span>
        <Input
          value={handle}
          onChange={(e) => setHandle(e.target.value.slice(0, COMMENT_HANDLE_MAX))}
          placeholder="yourhandle"
          aria-label="Your X handle"
          autoFocus={autoFocus}
          className="h-9 pl-6"
        />
      </div>
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
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" size="sm" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={posting || body.trim().length === 0 || handle.trim().length === 0}
          >
            {posting ? "Posting…" : submitLabel} <Send className="size-3.5" />
          </Button>
        </div>
      </div>
    </form>
  );
}

function CommentRow({
  comment,
  now,
  replies,
  replyingTo,
  setReplyingTo,
  onReply,
}: {
  comment: CampaignComment;
  now: number | null;
  replies: CampaignComment[];
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  onReply: (parentId: string, handle: string, body: string) => Promise<void>;
}) {
  return (
    <li className="flex flex-col gap-1 py-2.5">
      <p className="wrap-break-word text-sm">{comment.body}</p>
      <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
        <Author comment={comment} />
        {(comment.author_x_handle || comment.author_name) && now !== null && (
          <span aria-hidden>·</span>
        )}
        <span>{now === null ? "" : ago(comment.created_at, now)}</span>
        {now !== null && (
          <button
            type="button"
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="ml-1 font-semibold text-muted-foreground transition-colors hover:text-hero-pink"
          >
            Reply
          </button>
        )}
      </div>

      {replyingTo === comment.id && (
        <div className="mt-1 pl-4">
          <CommentForm
            submitLabel="Reply"
            autoFocus
            onCancel={() => setReplyingTo(null)}
            onSubmit={(handle, body) => onReply(comment.id, handle, body)}
          />
        </div>
      )}

      {replies.length > 0 && (
        <ul className="mt-1 flex flex-col gap-2 border-l-2 border-border pl-4">
          {replies.map((reply) => (
            <li key={reply.id} className="flex flex-col gap-1">
              <p className="wrap-break-word text-sm">{reply.body}</p>
              <span className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                <CornerDownRight className="size-3" />
                <Author comment={reply} />
                {(reply.author_x_handle || reply.author_name) && now !== null && (
                  <span aria-hidden>·</span>
                )}
                <span>{now === null ? "" : ago(reply.created_at, now)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Comments on a campaign, shown wherever the campaign card opens.
 *
 * Seeded from the server so the list is there on first paint, then kept in
 * local state - a new comment or reply is appended rather than refetched, so
 * the author sees their own words immediately.
 *
 * Threads only ever go one level deep: a comment's parent_id always points
 * at a top-level comment (the API flattens a reply-to-a-reply), so grouping
 * here is a single pass rather than a recursive tree.
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
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const now = useNow();

  const founderComment = comments.find((c) => c.is_founder) ?? null;
  // Sorted explicitly rather than trusting array position: a reply is
  // appended to the end of `comments` when it's posted (see handleReply),
  // which is not where it belongs once other replies already exist.
  const byNewest = (a: CampaignComment, b: CampaignComment) =>
    Date.parse(b.created_at) - Date.parse(a.created_at);
  const byOldest = (a: CampaignComment, b: CampaignComment) =>
    Date.parse(a.created_at) - Date.parse(b.created_at);

  const topLevel = comments
    .filter((c) => !c.parent_id && c.id !== founderComment?.id)
    .sort(byNewest);
  const repliesFor = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId).sort(byOldest);

  async function handleTopLevelSubmit(handle: string, body: string) {
    const comment = await postComment({ campaignId, authorXHandle: handle, body });
    setComments((prev) => [comment, ...prev]);
  }

  async function handleReply(parentId: string, handle: string, body: string) {
    const comment = await postComment({ campaignId, authorXHandle: handle, body, parentId });
    setComments((prev) => [...prev, comment]);
    setReplyingTo(null);
  }

  const label = (text: string) => (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
      {text}
    </h2>
  );

  const totalCount = comments.length;

  return (
    <section className="flex flex-col gap-4">
      {founderComment && (
        <div className="flex flex-col gap-1.5">
          {label("Founder's first comment")}
          <div className={cn("rounded-2xl bg-accent-yellow/35 px-4 py-3")}>
            <p className="wrap-break-word text-sm">{founderComment.body}</p>
            <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
              <Author comment={founderComment} />
              {(founderComment.author_x_handle || founderComment.author_name) && now !== null && (
                <span aria-hidden>·</span>
              )}
              <span>{now === null ? "" : ago(founderComment.created_at, now)}</span>
              {now !== null && (
                <button
                  type="button"
                  onClick={() =>
                    setReplyingTo(replyingTo === founderComment.id ? null : founderComment.id)
                  }
                  className="ml-1 font-semibold text-muted-foreground transition-colors hover:text-hero-pink"
                >
                  Reply
                </button>
              )}
            </div>

            {replyingTo === founderComment.id && (
              <div className="mt-2 pl-4">
                <CommentForm
                  submitLabel="Reply"
                  autoFocus
                  onCancel={() => setReplyingTo(null)}
                  onSubmit={(handle, body) => handleReply(founderComment.id, handle, body)}
                />
              </div>
            )}

            {repliesFor(founderComment.id).length > 0 && (
              <ul className="mt-2 flex flex-col gap-2 border-l-2 border-border/60 pl-4">
                {repliesFor(founderComment.id).map((reply) => (
                  <li key={reply.id} className="flex flex-col gap-1">
                    <p className="wrap-break-word text-sm">{reply.body}</p>
                    <span className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                      <CornerDownRight className="size-3" />
                      <Author comment={reply} />
                      {(reply.author_x_handle || reply.author_name) && now !== null && (
                        <span aria-hidden>·</span>
                      )}
                      <span>{now === null ? "" : ago(reply.created_at, now)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <MessageCircle className="size-3.5" />
          {totalCount === 0 ? "Comments" : `${totalCount} comment${totalCount === 1 ? "" : "s"}`}
        </h2>

        <CommentForm submitLabel="Post" onSubmit={handleTopLevelSubmit} />

        {topLevel.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {topLevel.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                now={now}
                replies={repliesFor(comment.id)}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                onReply={handleReply}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
