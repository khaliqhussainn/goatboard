/**
 * Keeps automated traffic out of the visitor counters.
 *
 * This is deliberately a blunt user-agent match, not a detection system. It
 * catches the traffic that identifies itself honestly - search crawlers, link
 * previewers, uptime monitors, scripts and headless browsers - which is the
 * overwhelming majority of what inflates a counter like this. Anything that
 * sets a browser user agent on purpose will get through, and that's accepted:
 * the number this protects is a vanity stat, not an access control.
 */

/**
 * Matched against the user agent. Generic words first (they cover crawlers
 * that aren't in any list), then the named offenders that don't use them.
 */
const BOT_PATTERN = new RegExp(
  [
    // Generic self-declared crawler words.
    "bot",
    "crawl",
    "spider",
    "slurp",
    "scrape",
    // Link unfurlers and previewers.
    "preview",
    "facebookexternalhit",
    "whatsapp",
    "embedly",
    // Scripts and HTTP libraries - a real browser is never one of these.
    "curl",
    "wget",
    "python-requests",
    "node-fetch",
    "go-http-client",
    "okhttp",
    "httpie",
    "postman",
    "java/",
    // Headless and driven browsers.
    "headless",
    "phantom",
    "puppeteer",
    "playwright",
    "selenium",
    "lighthouse",
    // Uptime and performance monitors.
    "uptime",
    "pingdom",
    "statuscake",
    "site24x7",
    "monitoring",
  ].join("|"),
  "i",
);

/**
 * Real devices whose names happen to contain a bot-looking substring. Removed
 * before matching rather than exempted afterwards, so a genuine crawler that
 * mentions one of them is still caught.
 */
const FALSE_POSITIVES = /cubot|abbott/gi;

/**
 * True for traffic that shouldn't count as a visitor.
 *
 * A missing user agent counts as a bot: every real browser sends one, so an
 * absent header means something hand-rolled is calling the endpoint directly.
 */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || !userAgent.trim()) return true;
  return BOT_PATTERN.test(userAgent.replace(FALSE_POSITIVES, ""));
}
