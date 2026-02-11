import { createClient } from "./client";

export type StorageBucket = "avatars" | "banners" | "portfolio" | "posts";

export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `${userId}/avatar-${timestamp}.${ext}`;
  return uploadFile("avatars", path, file);
}

export async function uploadBanner(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `${userId}/banner-${timestamp}.${ext}`;
  return uploadFile("banners", path, file);
}

export async function uploadPortfolioImage(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `${userId}/${timestamp}.${ext}`;
  return uploadFile("portfolio", path, file);
}

export async function uploadPostImage(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `${userId}/${timestamp}.${ext}`;
  return uploadFile("posts", path, file);
}

export async function uploadPortfolioVideo(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `${userId}/video-${timestamp}.${ext}`;
  return uploadFile("portfolio", path, file);
}

export async function uploadPortfolioAudio(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `${userId}/audio-${timestamp}.${ext}`;
  return uploadFile("portfolio", path, file);
}

export async function uploadPostVideo(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `${userId}/video-${timestamp}.${ext}`;
  return uploadFile("posts", path, file);
}

export async function uploadPostAudio(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `${userId}/audio-${timestamp}.${ext}`;
  return uploadFile("posts", path, file);
}

export async function uploadPortfolioModel(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `${userId}/model-${timestamp}.${ext}`;
  return uploadFile("portfolio", path, file);
}
