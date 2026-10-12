import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GetListedDrProject } from "@/lib/types";

export const DEFAULT_GET_LISTED_DR_PROJECTS: GetListedDrProject[] = [
  {
    key: "project_1",
    site_name: "Nick Launches",
    domain: "nicklaunches.com",
    dr: 76,
    sort_order: 1,
    updated_at: "",
  },
  {
    key: "project_2",
    site_name: "PushUp Quest",
    domain: "pushup.quest",
    dr: 37,
    sort_order: 2,
    updated_at: "",
  },
  {
    key: "project_3",
    site_name: "XMetrix",
    domain: "xmetrix.space",
    dr: 0,
    sort_order: 3,
    updated_at: "",
  },
];

/** Current manually maintained DR proof shown on the public Get Listed page. */
export async function getGetListedDrProjects(): Promise<GetListedDrProject[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("get_listed_dr_projects")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("get listed DR projects read failed", error);
      return DEFAULT_GET_LISTED_DR_PROJECTS;
    }

    return data?.length === 3 ? data : DEFAULT_GET_LISTED_DR_PROJECTS;
  } catch (error) {
    console.error("get listed DR projects read crashed", error);
    return DEFAULT_GET_LISTED_DR_PROJECTS;
  }
}
