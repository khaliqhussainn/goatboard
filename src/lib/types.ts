/** "pending_payment" is a new listing that has not been paid for yet. It is
 *  excluded from every public read, so it is not on the board. */
export type CampaignStatus = "active" | "pending_payment" | "suspended" | "removed";

export type ListingPaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

/** The $1 that puts a campaign on the board. */
export type ListingOrder = {
  id: string;
  campaign_id: string;
  /** Anonymous goatboard_uid of whoever started the listing. */
  owner_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_customer_id: string | null;
  provider_variant_id: string | null;
  amount: number;
  currency: string;
  payment_status: ListingPaymentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};
export type PurchaseStatus = "pending" | "paid" | "refunded" | "failed";
export type ReportStatus = "open" | "resolved" | "dismissed";

export type Category =
  | "product"
  | "startup"
  | "website"
  | "app"
  | "creator"
  | "music"
  | "meme"
  | "cause"
  | "game"
  | "other";

// Plain `type` aliases (not `interface`) so these structurally satisfy
// postgrest-js's `Record<string, unknown>` constraint on Row/Insert/Update —
// a named `interface` does not, even when its shape matches exactly.
export type Campaign = {
  id: string;
  slug: string;
  name: string;
  description: string;
  destination_url: string;
  image_url: string | null;
  category: Category;
  status: CampaignStatus;
  vote_power: number;
  paid_power: number;
  total_power: number;
  has_been_goat: boolean;
  /** When the current leader took #1; null for everyone else. */
  first_place_since: string | null;
  /** Stamped once, the first time a campaign holds #1 for 24 hours. */
  held_24h_at: string | null;
  click_count: number;
  /** Kept by trigger so the board doesn't count per card. */
  comment_count: number;
  x_handle: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type VisitorActivityPoint = {
  hour: string;
  visits: number;
};

export type VisitorStats = {
  totalVisits: number;
  liveVisitors: number;
  /** Gross USD taken across boosts and ad slots. */
  totalEarnings: number;
  activity: VisitorActivityPoint[];
};

export type CampaignComment = {
  id: string;
  campaign_id: string;
  /** Anonymous goatboard_uid cookie value, not an authenticated user. */
  author_id: string;
  /** Legacy free-text name, from before author_x_handle was required. Null on anything newer. */
  author_name: string | null;
  /** Without the leading "@". Required on every comment written since this shipped. */
  author_x_handle: string | null;
  /** True only for the comment posted with the campaign by its creator. */
  is_founder: boolean;
  /** The top-level comment this replies to; null for a top-level comment itself. */
  parent_id: string | null;
  body: string;
  created_at: string;
};

export type Vote = {
  id: string;
  campaign_id: string;
  voter_id: string;
  vote_date: string;
  created_at: string;
};

export type Purchase = {
  id: string;
  campaign_id: string;
  lemon_squeezy_order_id: string | null;
  amount: number;
  currency: string;
  power_granted: number;
  status: PurchaseStatus;
  created_at: string;
};

export type Report = {
  id: string;
  campaign_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
};

import type {
  GetListedBacklinkStatus,
  GetListedPackageKey,
  GetListedCampaignStatus,
  GetListedPaymentStatus,
  GetListedRequirementType,
  GetListedSubmissionStatus,
} from "@/lib/get-listed";

export type AdSlotStatus = "pending" | "paid";
export type AdSlotDuration = 7 | 14 | 30;

export type AdSlot = {
  id: string;
  name: string;
  description: string;
  destination_url: string;
  image_url: string | null;
  backdrop_url: string | null;
  /** The buyer's X handle, without the "@". Null only on rows created before
   *  it was required. */
  x_handle: string | null;
  duration_days: AdSlotDuration;
  amount: number;
  lemon_squeezy_order_id: string | null;
  status: AdSlotStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

/** The public-safe shape get_current_ad() returns — never a pending draft, order id, or amount. */
export type CurrentAd = {
  name: string;
  description: string;
  destination_url: string;
  image_url: string | null;
  backdrop_url: string | null;
  ends_at: string;
};

export type VideoAdStatus = "pending" | "paid";

export type VideoAd = {
  id: string;
  name: string;
  destination_url: string;
  video_url: string;
  /** The buyer's X handle, without the "@". Null only on rows created before
   *  it was required. */
  x_handle: string | null;
  amount: number;
  lemon_squeezy_order_id: string | null;
  status: VideoAdStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

/** The public-safe shape get_current_video_ad() returns — never a pending draft, order id, or amount. */
export type CurrentVideoAd = {
  name: string;
  destination_url: string;
  video_url: string;
  ends_at: string;
};

// --- Get Listed (paid distribution service) --------------------------------
// Separate from the billboard Campaign type above: these are never ranked,
// voted on, or boosted.

export type GetListedCampaign = {
  id: string;
  /** Anonymous goatboard_uid cookie value, not an authenticated user id. */
  owner_id: string;
  startup_name: string;
  website_url: string;
  description: string;
  category: Category;
  /** The buyer's own X handle, without the "@" — required since it became a
   *  form field. Distinct from x_url, the startup's profile link. */
  x_handle: string | null;
  x_url: string | null;
  linkedin_url: string | null;
  other_url: string | null;
  package_key: GetListedPackageKey;
  submission_target: number;
  status: GetListedCampaignStatus;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GetListedOrder = {
  id: string;
  campaign_id: string;
  owner_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_customer_id: string | null;
  provider_variant_id: string | null;
  package_key: GetListedPackageKey;
  amount: number;
  currency: string;
  payment_status: GetListedPaymentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GetListedSubmission = {
  id: string;
  campaign_id: string;
  directory_name: string;
  directory_url: string | null;
  status: GetListedSubmissionStatus;
  listing_url: string | null;
  requirement_type: GetListedRequirementType;
  backlink_status: GetListedBacklinkStatus;
  backlink_instructions: string | null;
  badge_code: string | null;
  backlink_url: string | null;
  backlink_verified_at: string | null;
  public_notes: string | null;
  internal_notes: string | null;
  visible_to_client: boolean;
  last_checked_at: string | null;
  /** Kept for compatibility with rows created before public/private notes. */
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Minimal hand-rolled Supabase Database type (kept in sync with supabase/schema.sql). */
export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: Campaign;
        Insert: Partial<Campaign> &
          Pick<Campaign, "slug" | "name" | "description" | "destination_url">;
        Update: Partial<Campaign>;
        Relationships: [];
      };
      campaign_comments: {
        Row: CampaignComment;
        Insert: Partial<CampaignComment> &
          Pick<CampaignComment, "campaign_id" | "author_id" | "body">;
        Update: Partial<CampaignComment>;
        Relationships: [];
      };
      votes: {
        Row: Vote;
        Insert: Partial<Vote> & Pick<Vote, "campaign_id" | "voter_id">;
        Update: Partial<Vote>;
        Relationships: [];
      };
      purchases: {
        Row: Purchase;
        Insert: Partial<Purchase> &
          Pick<Purchase, "campaign_id" | "amount" | "power_granted">;
        Update: Partial<Purchase>;
        Relationships: [];
      };
      reports: {
        Row: Report;
        Insert: Partial<Report> & Pick<Report, "campaign_id" | "reason">;
        Update: Partial<Report>;
        Relationships: [];
      };
      ad_slots: {
        Row: AdSlot;
        Insert: Partial<AdSlot> &
          Pick<AdSlot, "name" | "description" | "destination_url" | "duration_days" | "amount">;
        Update: Partial<AdSlot>;
        Relationships: [];
      };
      video_ads: {
        Row: VideoAd;
        Insert: Partial<VideoAd> &
          Pick<VideoAd, "name" | "destination_url" | "video_url" | "amount">;
        Update: Partial<VideoAd>;
        Relationships: [];
      };
      get_listed_campaigns: {
        Row: GetListedCampaign;
        Insert: Partial<GetListedCampaign> &
          Pick<
            GetListedCampaign,
            | "owner_id"
            | "startup_name"
            | "website_url"
            | "description"
            | "package_key"
            | "submission_target"
          >;
        Update: Partial<GetListedCampaign>;
        Relationships: [];
      };
      listing_orders: {
        Row: ListingOrder;
        Insert: Partial<ListingOrder> & Pick<ListingOrder, "campaign_id" | "owner_id" | "amount">;
        Update: Partial<ListingOrder>;
        Relationships: [];
      };
      get_listed_orders: {
        Row: GetListedOrder;
        Insert: Partial<GetListedOrder> &
          Pick<GetListedOrder, "campaign_id" | "owner_id" | "package_key" | "amount">;
        Update: Partial<GetListedOrder>;
        Relationships: [];
      };
      get_listed_submissions: {
        Row: GetListedSubmission;
        Insert: Partial<GetListedSubmission> &
          Pick<GetListedSubmission, "campaign_id" | "directory_name">;
        Update: Partial<GetListedSubmission>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      cast_vote: {
        Args: { p_campaign_id: string; p_voter_id: string };
        Returns: { success: boolean; message: string; total_power: number | null }[];
      };
      grant_purchase_power: {
        Args: {
          p_order_id: string;
          p_campaign_id: string;
          p_amount: number;
          p_currency: string;
          p_power: number;
        };
        Returns: { success: boolean; message: string; total_power: number | null }[];
      };
      record_click: {
        Args: { p_campaign_id: string };
        Returns: { success: boolean; new_click_count: number | null }[];
      };
      record_site_visit: {
        Args: { p_visitor_id: string | null };
        Returns: undefined;
      };
      record_visitor_heartbeat: {
        Args: { p_visitor_id: string };
        Returns: undefined;
      };
      get_visitor_stats: {
        Args: Record<string, never>;
        Returns: { total_visits: number; live_visitors: number }[];
      };
      get_visitor_activity: {
        Args: Record<string, never>;
        Returns: { hour_start: string; visits: number }[];
      };
      get_current_ad: {
        Args: Record<string, never>;
        Returns: CurrentAd[];
      };
      get_current_video_ad: {
        Args: Record<string, never>;
        Returns: CurrentVideoAd[];
      };
      /** Returns how many real purchases the activation displaced. */
      admin_activate_video_ad: {
        Args: { p_id: string };
        Returns: number;
      };
      sync_first_place: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      activate_get_listed_order: {
        Args: {
          p_order_id: string;
          p_provider_order_id: string;
          p_expected_amount: number;
          p_provider_customer_id?: string | null;
        };
        Returns: { success: boolean; message: string; campaign_id: string | null }[];
      };
      activate_listing_order: {
        Args: {
          p_order_id: string;
          p_provider_order_id: string;
          p_expected_amount: number;
          p_provider_customer_id?: string | null;
        };
        Returns: { success: boolean; message: string; campaign_id: string | null }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
