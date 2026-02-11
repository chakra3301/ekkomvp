import { prisma } from "@ekko/database";
import { TRPCError } from "@trpc/server";
import type { CollectivePermissions } from "@ekko/config";

export async function getMemberWithRole(collectiveId: string, userId: string) {
  return prisma.collectiveMember.findUnique({
    where: {
      collectiveId_userId: { collectiveId, userId },
    },
    include: { role: true },
  });
}

export function hasPermission(
  member: { role: { permissions: unknown } } | null,
  permission: keyof CollectivePermissions
): boolean {
  if (!member) return false;
  const perms = member.role.permissions as CollectivePermissions;
  return perms[permission] === true;
}

export function requirePermission(
  member: { role: { permissions: unknown } } | null,
  permission: keyof CollectivePermissions
) {
  if (!hasPermission(member, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You don't have the ${permission} permission`,
    });
  }
}

export async function requireMembership(collectiveId: string, userId: string) {
  const member = await getMemberWithRole(collectiveId, userId);
  if (!member || member.status !== "ACTIVE") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an active member of this collective",
    });
  }
  return member;
}
