import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { uploadAdVideo, extensionForVideoType } from "@/lib/storage";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const limited = rateLimit(`upload-video:${visitorId}:${getClientIp(request.headers)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.success) {
    return NextResponse.json({ message: "Too many uploads. Try again later." }, { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file provided." }, { status: 400 });
  }

  if (!extensionForVideoType(file.type)) {
    return NextResponse.json({ message: "Unsupported video type. Use MP4 or WebM." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ message: "Video must be under 25MB." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const url = await uploadAdVideo(admin, visitorId, await file.arrayBuffer(), file.type);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("video upload crashed", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: `Upload failed: ${detail}` }, { status: 500 });
  }
}
