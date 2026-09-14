import { permanentRedirect } from "next/navigation";

/**
 * The service moved to /get-listed when it became a real purchasable flow.
 * Kept as a redirect rather than deleted: the old path is in the sitemap that
 * has already been crawled, and the promo card linked here for a while.
 */
export default function DistributionRedirect() {
  permanentRedirect("/get-listed");
}
