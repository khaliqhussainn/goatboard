export type CampaignStatus = "active" | "suspended" | "removed";
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
  click_count: number;
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
  activity: VisitorActivityPoint[];
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
