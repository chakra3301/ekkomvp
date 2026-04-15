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

/// Compute the current number of unread Connect messages for a user.
/// Used so APNs updates the app-icon badge to an accurate count.
async function computeBadgeCount(userId: string): Promise<number> {
  const matches = await prisma.connectMatch.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: "ACTIVE",
    },
    select: { id: true },
  });
  const matchIds = matches.map((m) => m.id);
  if (matchIds.length === 0) return 0;

  return prisma.connectMessage.count({
    where: {
      matchId: { in: matchIds },
      senderId: { not: userId },
      readAt: null,
    },
  });
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const provider = getApnProvider();
  if (!provider) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true, pushPlatform: true },
  });

  if (!user?.pushToken || user.pushPlatform !== "ios") return;

  const badge = await computeBadgeCount(userId);

  const notification = new apn.Notification();
  notification.alert = { title: payload.title, body: payload.body };
  notification.sound = "default";
  notification.badge = badge;
  notification.topic = "app.ekkoconnect.connect";
  notification.payload = { url: payload.url };
  // 1 week — standard for social notifications
  notification.expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  try {
    const result = await provider.send(notification, user.pushToken);
    if (result.failed.length > 0) {
      const failure = result.failed[0];
      console.error("[Push] Failed:", failure?.response || failure);
      // Clear invalid tokens (410 Gone, BadDeviceToken, Unregistered)
      const status = failure?.status;
      const reason = (failure?.response as { reason?: string })?.reason;
      if (status === "410" || reason === "BadDeviceToken" || reason === "Unregistered") {
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
