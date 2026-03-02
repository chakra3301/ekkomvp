import { createClient } from "./client";

export async function uploadFile(
  bucket: string,
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

export async function uploadConnectMedia(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const isVideo = file.type.startsWith("video/");
  const prefix = isVideo ? "video" : "img";
  const path = `connect/${userId}/${prefix}-${timestamp}.${ext}`;
  return uploadFile("portfolio", path, file);
}

export async function uploadConnectAudio(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `connect/${userId}/audio-${timestamp}.${ext}`;
  return uploadFile("portfolio", path, file);
}

export async function uploadConnectModel(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `connect/${userId}/model-${timestamp}.${ext}`;
  return uploadFile("portfolio", path, file);
}

export async function uploadChatImage(
  userId: string,
  matchId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const path = `connect/chat/${matchId}/${userId}-${timestamp}.${ext}`;
  return uploadFile("portfolio", path, file);
}

// URL-based media type detection
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("/video-");
}

export function isAudioUrl(url: string): boolean {
  return /\.(mp3|wav|ogg|aac)(\?|$)/i.test(url) || url.includes("/audio-");
}

export function isModelUrl(url: string): boolean {
  return /\.(glb|gltf|obj|fbx|usdz)(\?|$)/i.test(url) || url.includes("/model-");
}

const MODEL_EXTENSIONS = [".glb", ".gltf", ".obj", ".fbx", ".usdz"];

export function isModelFile(file: File): boolean {
  return MODEL_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}
