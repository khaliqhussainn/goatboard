import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const limited = rateLimit(`upload:${visitorId}:${getClientIp(request.headers)}`, {
    limit: 20,
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

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ message: "Unsupported image type." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ message: "Image must be under 5MB." }, { status: 400 });
  }

  const admin = createAdminClient();
  const path = `${visitorId}/${nanoid()}.${ext}`;

  const { error } = await admin.storage
    .from("campaign-images")
    .upload(path, await file.arrayBuffer(), { contentType: file.type });

  if (error) {
    return NextResponse.json({ message: "Upload failed." }, { status: 500 });
  }

  const { data } = admin.storage.from("campaign-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
