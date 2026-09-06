/**
 * Fire-and-forget: records an outbound click on a campaign's destination
 * link without blocking or delaying navigation. Called from onClick
 * handlers on <a target="_blank"> links — the browser opens the new tab
 * regardless of whether this request succeeds.
 */
export function trackClick(campaignId: string) {
  fetch("/api/clicks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaignId }),
    keepalive: true,
  }).catch(() => {
    // best-effort only — a failed click ping should never surface to the user
  });
}
