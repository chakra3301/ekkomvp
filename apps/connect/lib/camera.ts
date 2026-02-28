import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export async function takePicture(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  const permission = await Camera.checkPermissions();
  if (permission.camera === "prompt") {
    await Camera.requestPermissions();
  }

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
  });

  return photo.dataUrl || null;
}

export async function pickFromGallery(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  const permission = await Camera.checkPermissions();
  if (permission.photos === "prompt") {
    await Camera.requestPermissions();
  }

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
  });

  return photo.dataUrl || null;
}
