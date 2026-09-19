import "server-only";
import { nanoid } from "nanoid";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/svg+xml": "svg",
};

export function extensionForImageType(contentType: string): string | null {
  return EXT_BY_TYPE[contentType.split(";")[0].trim().toLowerCase()] ?? null;
}

/** Uploads image bytes to the campaign-images bucket and returns its public URL. */
export async function uploadCampaignImage(
  admin: SupabaseClient<Database>,
  ownerId: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const ext = extensionForImageType(contentType);
  if (!ext) throw new Error("Unsupported image type.");

  const path = `${ownerId}/${nanoid()}.${ext}`;
  const { error } = await admin.storage
    .from("campaign-images")
    .upload(path, bytes, { contentType });

  if (error) throw error;

  const { data } = admin.storage.from("campaign-images").getPublicUrl(path);
  return data.publicUrl;
}

const VIDEO_EXT_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function extensionForVideoType(contentType: string): string | null {
  return VIDEO_EXT_BY_TYPE[contentType.split(";")[0].trim().toLowerCase()] ?? null;
}

/** Uploads video bytes to the ad-videos bucket and returns its public URL. */
export async function uploadAdVideo(
  admin: SupabaseClient<Database>,
  ownerId: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const ext = extensionForVideoType(contentType);
  if (!ext) throw new Error("Unsupported video type.");

  const path = `${ownerId}/${nanoid()}.${ext}`;
  const { error } = await admin.storage.from("ad-videos").upload(path, bytes, { contentType });

  if (error) throw error;

  const { data } = admin.storage.from("ad-videos").getPublicUrl(path);
  return data.publicUrl;
}
