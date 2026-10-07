import "server-only";
import { cache } from "react";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import type { CampaignAchievement } from "@/lib/types";

/** Reconciles only facts derived from GoatBoard's own campaign, vote, and
 * purchase rows. The database function is idempotent and awards are never
 * deleted, so historical milestones survive later ranking changes. */
export async function syncCampaignAchievements(): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("sync_campaign_achievements");
    if (error) console.error("sync_campaign_achievements failed", error);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return;
    }
    console.error("sync_campaign_achievements crashed", error);
  }
}

export const getCampaignAchievements = cache(
  async (campaignId: string): Promise<CampaignAchievement[]> => {
    await syncCampaignAchievements();

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("campaign_achievements")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("awarded_at", { ascending: false });

      if (error) {
        console.error("campaign achievements read failed", error);
        return [];
      }

      // A campaign can win multiple weeks. The public badge collection shows
      // one badge per type while the newest row carries its current analytics.
      const newestByType = new Map<string, CampaignAchievement>();
      for (const achievement of data ?? []) {
        if (!newestByType.has(achievement.achievement_type)) {
          newestByType.set(achievement.achievement_type, achievement);
        }
      }
      return [...newestByType.values()];
    } catch (error) {
      if (!(error instanceof SupabaseConfigError)) {
        console.error("campaign achievements read crashed", error);
      }
      return [];
    }
  },
);
