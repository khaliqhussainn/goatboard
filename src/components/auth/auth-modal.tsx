"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AuthModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          window.location.pathname,
        )}`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  React.useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets form on close
      setStatus("idle");
      setEmail("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>One quick step</DialogTitle>
          <DialogDescription>
            Enter your email to get a sign-in link. No password, no profile.
          </DialogDescription>
        </DialogHeader>

        {status === "sent" ? (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-muted py-8 text-center">
            <Mail className="size-6" />
            <p className="text-sm font-medium">Check {email}</p>
            <p className="text-xs text-muted-foreground">
              Click the link we sent you to finish signing in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              type="email"
              required
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send sign-in link"}
            </Button>
            {status === "error" && (
              <p className="text-xs text-red-500">
                Something went wrong. Try again in a moment.
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
