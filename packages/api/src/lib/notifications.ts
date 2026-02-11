import { prisma } from "@ekko/database";

type NotificationType = "FOLLOW" | "LIKE" | "COMMENT" | "MESSAGE" | "WORK_REQUEST" | "APPLICATION" | "WORK_ORDER_UPDATE" | "DELIVERY" | "MILESTONE_UPDATE" | "ESCROW_UPDATE" | "COLLECTIVE_INVITE" | "COLLECTIVE_JOIN_REQUEST" | "COLLECTIVE_JOIN_APPROVED" | "COLLECTIVE_POST";

export async function createNotification({
  type,
  userId,
  actorId,
  entityId,
  entityType,
}: {
  type: NotificationType;
  userId: string;
  actorId: string;
  entityId?: string;
  entityType?: string;
}) {
  // Don't notify yourself
  if (userId === actorId) return;

  try {
    await prisma.notification.create({
      data: { type, userId, actorId, entityId, entityType },
    });
  } catch {
    // Non-blocking: don't fail the primary action if notification creation fails
  }
}
