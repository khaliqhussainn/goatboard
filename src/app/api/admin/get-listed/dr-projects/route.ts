import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";

const projectSchema = z.object({
  key: z.enum(["project_1", "project_2", "project_3"]),
  site_name: z.string().trim().min(1).max(80),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(253)
    .regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i, "Enter a domain without https://"),
  dr: z.coerce.number().int().min(0).max(100),
});

const inputSchema = z.object({
  projects: z.array(projectSchema).length(3),
});

const SORT_ORDER = { project_1: 1, project_2: 2, project_3: 3 } as const;

export async function PUT(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid graph data." },
      { status: 400 },
    );
  }

  if (new Set(parsed.data.projects.map((project) => project.key)).size !== 3) {
    return NextResponse.json({ message: "All three projects are required." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const rows = parsed.data.projects.map((project) => ({
      ...project,
      sort_order: SORT_ORDER[project.key],
    }));
    const { error } = await admin
      .from("get_listed_dr_projects")
      .upsert(rows, { onConflict: "key" });

    if (error) {
      console.error("get listed DR projects update failed", error);
      return NextResponse.json({ message: "Couldn't update the DR graph." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("get listed DR projects update crashed", error);
    return NextResponse.json({ message: "Couldn't update the DR graph." }, { status: 500 });
  }
}
