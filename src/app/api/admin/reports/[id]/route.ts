import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ status: z.enum(["resolved", "dismissed"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("reports").update({ status: parsed.data.status }).eq("id", id);

  if (error) {
    return NextResponse.json({ message: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
