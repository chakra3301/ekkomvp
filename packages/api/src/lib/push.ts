import apn from "apn";
import { prisma } from "@ekko/database";

let apnProvider: apn.Provider | null = null;

function getApnProvider(): apn.Provider | null {
  if (apnProvider) return apnProvider;

  const key = process.env.APNS_KEY;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;

  if (!key || !keyId || !teamId) {
    console.warn("[Push] APNs not configured — missing APNS_KEY, APNS_KEY_ID, or APNS_TEAM_ID");
    return null;
  }

  apnProvider = new apn.Provider({
    token: {
      key: Buffer.from(key, "utf8"),
      keyId,
      teamId,
    },
    production: process.env.NODE_ENV === "production",
  });

  return apnProvider;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const provider = getApnProvider();
  if (!provider) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true, pushPlatform: true },
  });

  if (!user?.pushToken || user.pushPlatform !== "ios") return;

  const notification = new apn.Notification();
  notification.alert = { title: payload.title, body: payload.body };
  notification.sound = "default";
  notification.badge = 1;
  notification.topic = "app.ekkoconnect.connect";
  notification.payload = { url: payload.url };

  try {
    const result = await provider.send(notification, user.pushToken);
    if (result.failed.length > 0) {
      console.error("[Push] Failed:", result.failed[0]?.response);
      // Clear invalid tokens
      if (result.failed[0]?.status === "410") {
        await prisma.user.update({
          where: { id: userId },
          data: { pushToken: null, pushPlatform: null },
        });
      }
    }
  } catch (err) {
    console.error("[Push] Error sending notification:", err);
  }
}
