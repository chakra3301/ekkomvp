import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export async function getCurrentPosition(): Promise<{
  latitude: number;
  longitude: number;
}> {
  if (Capacitor.isNativePlatform()) {
    const permission = await Geolocation.checkPermissions();
    if (
      permission.location === "prompt" ||
      permission.location === "prompt-with-rationale"
    ) {
      await Geolocation.requestPermissions();
    }
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
