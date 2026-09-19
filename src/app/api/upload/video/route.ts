import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { extensionForVideoType } from "@/lib/storage";
import { AD_VIDEO_BUCKET, MAX_VIDEO_BYTES } from "@/lib/validation";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  contentType: z.string().min(1),
  size: z.number().int().positive(),
});

/**
 * Hands back a one-shot signed upload URL instead of taking the file itself.
 *
 * The video goes browser -> Supabase Storage directly. Posting a 25MB file
 * through this handler is not an option: a serverless request body is capped
 * around 4.5MB on Vercel, so anything bigger is rejected by the platform
 * before the route runs, and that rejection isn't JSON - which is why the
 * uploader could only ever report a generic failure for it.
 *
 * The declared size is checked here to fail early with a clear message, but
 * it's the bucket's own file_size_limit that enforces the cap, since nothing
 * stops a client from understating it.
 */
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

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 });
  }

  const ext = extensionForVideoType(parsed.data.contentType);
  if (!ext) {
    return NextResponse.json(
      { message: "Unsupported video type. Use MP4 or WebM." },
      { status: 400 },
    );
  }

  if (parsed.data.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ message: "Video must be under 25MB." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const path = `${visitorId}/${nanoid()}.${ext}`;
    const { data, error } = await admin.storage
      .from(AD_VIDEO_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      // Names the bucket in the log because "Bucket not found" here means
      // schema.sql hasn't been run against this project yet.
      console.error(`createSignedUploadUrl failed for ${AD_VIDEO_BUCKET}`, error);
      return NextResponse.json(
        { message: `Couldn't start the upload: ${error?.message ?? "unknown error"}` },
        { status: 500 },
      );
    }

    const { data: publicUrl } = admin.storage.from(AD_VIDEO_BUCKET).getPublicUrl(path);
    return NextResponse.json({
      path: data.path,
      token: data.token,
      publicUrl: publicUrl.publicUrl,
    });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("video upload signing crashed", error);
    return NextResponse.json({ message: "Couldn't start the upload." }, { status: 500 });
  }
}
