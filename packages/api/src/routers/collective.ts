import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma, PortfolioBlockType, PortfolioLayout } from "@ekko/database";
import { COLLECTIVE_LIMITS, DEFAULT_COLLECTIVE_ROLES } from "@ekko/config";

import { router, publicProcedure, protectedProcedure } from "../trpc";
import {
  getMemberWithRole,
  requirePermission,
  requireMembership,
} from "../lib/collective-permissions";
import { createNotification } from "../lib/notifications";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, COLLECTIVE_LIMITS.SLUG_MAX);
}

async function getUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.collective.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

const profileSelect = {
  username: true,
  displayName: true,
  avatarUrl: true,
  verificationStatus: true,
} as const;

export const collectiveRouter = router({
  // ============ CRUD ============

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(COLLECTIVE_LIMITS.NAME_MIN).max(COLLECTIVE_LIMITS.NAME_MAX),
        description: z.string().max(COLLECTIVE_LIMITS.DESCRIPTION_MAX).optional(),
        visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
        joinType: z.enum(["OPEN", "REQUEST", "INVITE_ONLY"]).default("OPEN"),
        bannerUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = await getUniqueSlug(input.name);

      const collective = await prisma.$transaction(async (tx) => {
        const col = await tx.collective.create({
          data: {
            name: input.name,
            slug,
            description: input.description,
            bannerUrl: input.bannerUrl,
            visibility: input.visibility,
            joinType: input.joinType,
            creatorId: ctx.user.id,
            membersCount: 1,
          },
        });

        // Create default roles
        const roles = await Promise.all(
          DEFAULT_COLLECTIVE_ROLES.map((role) =>
            tx.collectiveRole.create({
              data: {
                collectiveId: col.id,
                name: role.name,
                slug: role.slug,
                isDefault: role.isDefault,
                permissions: role.permissions as any,
                sortOrder: role.sortOrder,
              },
            })
          )
        );

        const creatorRole = roles.find((r) => r.slug === "creator")!;

        // Add creator as member
        await tx.collectiveMember.create({
          data: {
            collectiveId: col.id,
            userId: ctx.user.id,
            roleId: creatorRole.id,
            status: "ACTIVE",
          },
        });

        return col;
      });

      return collective;
    }),

  getBySlug: publicProcedure
    .input(z.string())
    .query(async ({ input: slug, ctx }) => {
      const collective = await prisma.collective.findUnique({
        where: { slug },
        include: {
          creator: {
            include: { profile: { select: profileSelect } },
          },
        },
      });

      if (!collective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
      }

      // Private collectives require membership
      if (collective.visibility === "PRIVATE" && ctx.user) {
        const member = await getMemberWithRole(collective.id, ctx.user.id);
        if (!member || member.status !== "ACTIVE") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
        }
      } else if (collective.visibility === "PRIVATE" && !ctx.user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
      }

      // Get viewer's membership if authenticated
      let viewerMembership = null;
      if (ctx.user) {
        const member = await getMemberWithRole(collective.id, ctx.user.id);
        if (member) {
          viewerMembership = {
            status: member.status,
            role: {
              name: member.role.name,
              slug: member.role.slug,
              permissions: member.role.permissions,
            },
          };
        }
      }

      return { ...collective, viewerMembership };
    }),

  getAll: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(COLLECTIVE_LIMITS.PAGE_SIZE),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, cursor, limit } = input;

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Only show public collectives (+ user's private ones if authenticated)
      if (ctx.user) {
        where.AND = [
          {
            OR: [
              { visibility: "PUBLIC" },
              {
                visibility: "PRIVATE",
                members: {
                  some: { userId: ctx.user.id, status: "ACTIVE" },
                },
              },
            ],
          },
        ];
      } else {
        where.visibility = "PUBLIC";
      }

      const collectives = await prisma.collective.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            include: { profile: { select: profileSelect } },
          },
        },
      });

      let nextCursor: string | undefined;
      if (collectives.length > limit) {
        const next = collectives.pop();
        nextCursor = next?.id;
      }

      return { collectives, nextCursor };
    }),

  getMyCollectives: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await prisma.collectiveMember.findMany({
      where: { userId: ctx.user.id, status: "ACTIVE" },
      include: {
        collective: {
          include: {
            creator: {
              include: { profile: { select: profileSelect } },
            },
          },
        },
        role: true,
      },
      orderBy: { joinedAt: "desc" },
    });

    return memberships.map((m) => ({
      ...m.collective,
      viewerRole: { name: m.role.name, slug: m.role.slug, permissions: m.role.permissions },
    }));
  }),

  update: protectedProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        name: z.string().min(COLLECTIVE_LIMITS.NAME_MIN).max(COLLECTIVE_LIMITS.NAME_MAX).optional(),
        description: z.string().max(COLLECTIVE_LIMITS.DESCRIPTION_MAX).optional().nullable(),
        visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
        joinType: z.enum(["OPEN", "REQUEST", "INVITE_ONLY"]).optional(),
        bannerUrl: z.string().url().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberWithRole(input.collectiveId, ctx.user.id);
      requirePermission(member, "canManageCollective");

      const { collectiveId, ...data } = input;

      let slug: string | undefined;
      if (data.name) {
        const current = await prisma.collective.findUnique({ where: { id: collectiveId } });
        if (current && data.name !== current.name) {
          slug = await getUniqueSlug(data.name, collectiveId);
        }
      }

      const updated = await prisma.collective.update({
        where: { id: collectiveId },
        data: { ...data, ...(slug ? { slug } : {}) },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: collectiveId }) => {
      const collective = await prisma.collective.findUnique({ where: { id: collectiveId } });
      if (!collective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
      }
      if (collective.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can delete the collective" });
      }
      await prisma.collective.delete({ where: { id: collectiveId } });
      return { success: true };
    }),

  // ============ MEMBERSHIP ============

  join: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: collectiveId }) => {
      const collective = await prisma.collective.findUnique({ where: { id: collectiveId } });
      if (!collective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
      }
      if (collective.joinType !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This collective is not open for direct joining" });
      }

      const existing = await prisma.collectiveMember.findUnique({
        where: { collectiveId_userId: { collectiveId, userId: ctx.user.id } },
      });
      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You are already a member or have a pending request" });
      }

      const memberRole = await prisma.collectiveRole.findUnique({
        where: { collectiveId_slug: { collectiveId, slug: "member" } },
      });

      await prisma.$transaction([
        prisma.collectiveMember.create({
          data: {
            collectiveId,
            userId: ctx.user.id,
            roleId: memberRole!.id,
            status: "ACTIVE",
          },
        }),
        prisma.collective.update({
          where: { id: collectiveId },
          data: { membersCount: { increment: 1 } },
        }),
      ]);

      return { success: true };
    }),

  requestJoin: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: collectiveId }) => {
      const collective = await prisma.collective.findUnique({ where: { id: collectiveId } });
      if (!collective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
      }
      if (collective.joinType !== "REQUEST") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This collective does not accept join requests" });
      }

      const existing = await prisma.collectiveMember.findUnique({
        where: { collectiveId_userId: { collectiveId, userId: ctx.user.id } },
      });
      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You already have a membership or pending request" });
      }

      const memberRole = await prisma.collectiveRole.findUnique({
        where: { collectiveId_slug: { collectiveId, slug: "member" } },
      });

      await prisma.collectiveMember.create({
        data: {
          collectiveId,
          userId: ctx.user.id,
          roleId: memberRole!.id,
          status: "PENDING",
        },
      });

      // Notify creator
      await createNotification({
        type: "COLLECTIVE_JOIN_REQUEST",
        userId: collective.creatorId,
        actorId: ctx.user.id,
        entityId: collectiveId,
        entityType: "collective",
      });

      return { success: true };
    }),

  approveRequest: protectedProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberWithRole(input.collectiveId, ctx.user.id);
      requirePermission(member, "canManageMembers");

      const target = await prisma.collectiveMember.findUnique({
        where: { collectiveId_userId: { collectiveId: input.collectiveId, userId: input.userId } },
      });
      if (!target || target.status !== "PENDING") {
        throw new TRPCError({ code: "NOT_FOUND", message: "No pending request found" });
      }

      await prisma.$transaction([
        prisma.collectiveMember.update({
          where: { collectiveId_userId: { collectiveId: input.collectiveId, userId: input.userId } },
          data: { status: "ACTIVE" },
        }),
        prisma.collective.update({
          where: { id: input.collectiveId },
          data: { membersCount: { increment: 1 } },
        }),
      ]);

      await createNotification({
        type: "COLLECTIVE_JOIN_APPROVED",
        userId: input.userId,
        actorId: ctx.user.id,
        entityId: input.collectiveId,
        entityType: "collective",
      });

      return { success: true };
    }),

  denyRequest: protectedProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberWithRole(input.collectiveId, ctx.user.id);
      requirePermission(member, "canManageMembers");

      await prisma.collectiveMember.delete({
        where: { collectiveId_userId: { collectiveId: input.collectiveId, userId: input.userId } },
      });

      return { success: true };
    }),

  invite: protectedProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberWithRole(input.collectiveId, ctx.user.id);
      requirePermission(member, "canInvite");

      const existing = await prisma.collectiveMember.findUnique({
        where: { collectiveId_userId: { collectiveId: input.collectiveId, userId: input.userId } },
      });
      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User is already a member or has a pending invite" });
      }

      const memberRole = await prisma.collectiveRole.findUnique({
        where: { collectiveId_slug: { collectiveId: input.collectiveId, slug: "member" } },
      });

      await prisma.collectiveMember.create({
        data: {
          collectiveId: input.collectiveId,
          userId: input.userId,
          roleId: memberRole!.id,
          status: "INVITED",
        },
      });

      await createNotification({
        type: "COLLECTIVE_INVITE",
        userId: input.userId,
        actorId: ctx.user.id,
        entityId: input.collectiveId,
        entityType: "collective",
      });

      return { success: true };
    }),

  acceptInvite: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: collectiveId }) => {
      const member = await prisma.collectiveMember.findUnique({
        where: { collectiveId_userId: { collectiveId, userId: ctx.user.id } },
      });
      if (!member || member.status !== "INVITED") {
        throw new TRPCError({ code: "NOT_FOUND", message: "No invite found" });
      }

      await prisma.$transaction([
        prisma.collectiveMember.update({
          where: { collectiveId_userId: { collectiveId, userId: ctx.user.id } },
          data: { status: "ACTIVE" },
        }),
        prisma.collective.update({
          where: { id: collectiveId },
          data: { membersCount: { increment: 1 } },
        }),
      ]);

      return { success: true };
    }),

  declineInvite: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: collectiveId }) => {
      await prisma.collectiveMember.delete({
        where: { collectiveId_userId: { collectiveId, userId: ctx.user.id } },
      });
      return { success: true };
    }),

  leave: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: collectiveId }) => {
      const collective = await prisma.collective.findUnique({ where: { id: collectiveId } });
      if (!collective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
      }
      if (collective.creatorId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The creator cannot leave the collective" });
      }

      await prisma.$transaction([
        prisma.collectiveMember.delete({
          where: { collectiveId_userId: { collectiveId, userId: ctx.user.id } },
        }),
        prisma.collective.update({
          where: { id: collectiveId },
          data: { membersCount: { decrement: 1 } },
        }),
      ]);

      return { success: true };
    }),

  kickMember: protectedProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberWithRole(input.collectiveId, ctx.user.id);
      requirePermission(member, "canManageMembers");

      const target = await getMemberWithRole(input.collectiveId, input.userId);
      if (!target || target.status !== "ACTIVE") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      // Cannot kick someone with a higher rank (lower sortOrder)
      if (target.role.sortOrder <= member!.role.sortOrder) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot kick a member with equal or higher rank" });
      }

      await prisma.$transaction([
        prisma.collectiveMember.delete({
          where: { collectiveId_userId: { collectiveId: input.collectiveId, userId: input.userId } },
        }),
        prisma.collective.update({
          where: { id: input.collectiveId },
          data: { membersCount: { decrement: 1 } },
        }),
      ]);

      return { success: true };
    }),

  // ============ ROLES ============

  getRoles: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: collectiveId }) => {
      await requireMembership(collectiveId, ctx.user.id);

      const roles = await prisma.collectiveRole.findMany({
        where: { collectiveId },
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { members: true } },
        },
      });

      return roles;
    }),

  createRole: protectedProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        name: z.string().min(1).max(COLLECTIVE_LIMITS.ROLE_NAME_MAX),
        permissions: z.object({
          canPost: z.boolean(),
          canModerate: z.boolean(),
          canEditPortfolio: z.boolean(),
          canManageMembers: z.boolean(),
          canManageRoles: z.boolean(),
          canManageCollective: z.boolean(),
          canInvite: z.boolean(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberWithRole(input.collectiveId, ctx.user.id);
      requirePermission(member, "canManageRoles");

      const slug = generateSlug(input.name);

      // Check for slug conflicts
      const existing = await prisma.collectiveRole.findUnique({
        where: { collectiveId_slug: { collectiveId: input.collectiveId, slug } },
      });
      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A role with that name already exists" });
      }

      // Get max sortOrder
      const lastRole = await prisma.collectiveRole.findFirst({
        where: { collectiveId: input.collectiveId },
        orderBy: { sortOrder: "desc" },
      });

      const role = await prisma.collectiveRole.create({
        data: {
          collectiveId: input.collectiveId,
          name: input.name,
          slug,
          isDefault: false,
          permissions: input.permissions as any,
          sortOrder: (lastRole?.sortOrder ?? 0) + 1,
        },
      });

      return role;
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        name: z.string().min(1).max(COLLECTIVE_LIMITS.ROLE_NAME_MAX).optional(),
        permissions: z
          .object({
            canPost: z.boolean(),
            canModerate: z.boolean(),
            canEditPortfolio: z.boolean(),
            canManageMembers: z.boolean(),
            canManageRoles: z.boolean(),
            canManageCollective: z.boolean(),
            canInvite: z.boolean(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const role = await prisma.collectiveRole.findUnique({ where: { id: input.roleId } });
      if (!role) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
      }

      const member = await getMemberWithRole(role.collectiveId, ctx.user.id);
      requirePermission(member, "canManageRoles");

      // Cannot modify creator role permissions
      if (role.slug === "creator" && input.permissions) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot modify the creator role permissions" });
      }

      const data: any = {};
      if (input.name) {
        data.name = input.name;
        if (!role.isDefault) {
          data.slug = generateSlug(input.name);
        }
      }
      if (input.permissions) {
        data.permissions = input.permissions;
      }

      const updated = await prisma.collectiveRole.update({
        where: { id: input.roleId },
        data,
      });

      return updated;
    }),

  deleteRole: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: roleId }) => {
      const role = await prisma.collectiveRole.findUnique({ where: { id: roleId } });
      if (!role) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
      }

      const member = await getMemberWithRole(role.collectiveId, ctx.user.id);
      requirePermission(member, "canManageRoles");

      if (role.isDefault) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete default roles" });
      }

      // Reassign members to the "member" role
      const memberRole = await prisma.collectiveRole.findUnique({
        where: { collectiveId_slug: { collectiveId: role.collectiveId, slug: "member" } },
      });

      await prisma.$transaction([
        prisma.collectiveMember.updateMany({
          where: { roleId },
          data: { roleId: memberRole!.id },
        }),
        prisma.collectiveRole.delete({ where: { id: roleId } }),
      ]);

      return { success: true };
    }),

  assignRole: protectedProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        userId: z.string().uuid(),
        roleId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberWithRole(input.collectiveId, ctx.user.id);
      requirePermission(member, "canManageRoles");

      const targetRole = await prisma.collectiveRole.findUnique({ where: { id: input.roleId } });
      if (!targetRole || targetRole.collectiveId !== input.collectiveId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Role not found in this collective" });
      }

      if (targetRole.slug === "creator") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot assign the creator role" });
      }

      await prisma.collectiveMember.update({
        where: { collectiveId_userId: { collectiveId: input.collectiveId, userId: input.userId } },
        data: { roleId: input.roleId },
      });

      return { success: true };
    }),

  // ============ MEMBERS ============

  getMembers: publicProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(COLLECTIVE_LIMITS.MEMBERS_PAGE_SIZE),
      })
    )
    .query(async ({ input, ctx }) => {
      const collective = await prisma.collective.findUnique({ where: { id: input.collectiveId } });
      if (!collective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
      }

      // Private collectives require membership
      if (collective.visibility === "PRIVATE") {
        if (!ctx.user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
        }
        await requireMembership(input.collectiveId, ctx.user.id);
      }

      // Use offset-based pagination for composite PK
      const members = await prisma.collectiveMember.findMany({
        where: { collectiveId: input.collectiveId, status: "ACTIVE" },
        take: input.limit + 1,
        orderBy: { joinedAt: "asc" },
        include: {
          user: {
            include: { profile: { select: profileSelect } },
          },
          role: true,
        },
        ...(input.cursor
          ? {
              cursor: {
                collectiveId_userId: {
                  collectiveId: input.collectiveId,
                  userId: input.cursor,
                },
              },
              skip: 1,
            }
          : {}),
      });

      let nextCursor: string | undefined;
      if (members.length > input.limit) {
        const next = members.pop();
        nextCursor = next?.userId;
      }

      return { members, nextCursor };
    }),

  getPendingRequests: protectedProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(COLLECTIVE_LIMITS.MEMBERS_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const member = await getMemberWithRole(input.collectiveId, ctx.user.id);
      requirePermission(member, "canManageMembers");

      const pending = await prisma.collectiveMember.findMany({
        where: { collectiveId: input.collectiveId, status: "PENDING" },
        take: input.limit + 1,
        orderBy: { joinedAt: "asc" },
        include: {
          user: {
            include: { profile: { select: profileSelect } },
          },
        },
        ...(input.cursor
          ? {
              cursor: {
                collectiveId_userId: {
                  collectiveId: input.collectiveId,
                  userId: input.cursor,
                },
              },
              skip: 1,
            }
          : {}),
      });

      let nextCursor: string | undefined;
      if (pending.length > input.limit) {
        const next = pending.pop();
        nextCursor = next?.userId;
      }

      return { members: pending, nextCursor };
    }),

  // ============ COLLECTIVE POSTS ============

  createCollectivePost: protectedProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        content: z.string().max(500).optional(),
        mediaUrls: z.array(z.string()).optional(),
        visibility: z.enum(["COLLECTIVE_ONLY", "BOTH"]).default("COLLECTIVE_ONLY"),
        blocks: z
          .array(
            z.object({
              type: z.nativeEnum(PortfolioBlockType),
              content: z.record(z.any()),
              sortOrder: z.number().min(0),
            })
          )
          .max(20)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberWithRole(input.collectiveId, ctx.user.id);
      requirePermission(member, "canPost");

      const post = await prisma.$transaction(async (tx) => {
        const p = await tx.post.create({
          data: {
            userId: ctx.user.id,
            content: input.content,
            mediaUrls: input.mediaUrls || [],
            collectiveId: input.collectiveId,
            collectiveVisibility: input.visibility,
            ...(input.blocks && input.blocks.length > 0
              ? {
                  blocks: {
                    create: input.blocks.map((b) => ({
                      type: b.type,
                      content: b.content,
                      sortOrder: b.sortOrder,
                    })),
                  },
                }
              : {}),
          },
          include: {
            user: {
              include: { profile: { select: profileSelect } },
            },
            blocks: { orderBy: { sortOrder: "asc" } },
            _count: { select: { likes: true, comments: true } },
          },
        });

        await tx.collective.update({
          where: { id: input.collectiveId },
          data: { postsCount: { increment: 1 } },
        });

        return p;
      });

      return { ...post, likesCount: post._count.likes, commentsCount: post._count.comments };
    }),

  getCollectivePosts: publicProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(COLLECTIVE_LIMITS.POSTS_PAGE_SIZE),
      })
    )
    .query(async ({ input, ctx }) => {
      const collective = await prisma.collective.findUnique({ where: { id: input.collectiveId } });
      if (!collective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
      }

      if (collective.visibility === "PRIVATE") {
        if (!ctx.user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
        }
        await requireMembership(input.collectiveId, ctx.user.id);
      }

      const posts = await prisma.post.findMany({
        where: { collectiveId: input.collectiveId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            include: { profile: { select: profileSelect } },
          },
          blocks: { orderBy: { sortOrder: "asc" } },
          likes: { select: { userId: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });

      let nextCursor: string | undefined;
      if (posts.length > input.limit) {
        const next = posts.pop();
        nextCursor = next?.id;
      }

      const transformedPosts = posts.map((post) => ({
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      }));

      return { posts: transformedPosts, nextCursor };
    }),

  // ============ COLLECTIVE PORTFOLIO ============

  createCollectiveProject: protectedProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        title: z.string().min(1).max(100),
        description: z.string().max(2000).optional(),
        coverUrl: z.string().url().optional(),
        category: z.string().max(50).optional(),
        tags: z.array(z.string().max(30)).max(15).optional(),
        layout: z.nativeEnum(PortfolioLayout).default(PortfolioLayout.GRID),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberWithRole(input.collectiveId, ctx.user.id);
      requirePermission(member, "canEditPortfolio");

      const baseSlug = generateSlug(input.title);
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await prisma.collectivePortfolioProject.findUnique({
          where: { collectiveId_slug: { collectiveId: input.collectiveId, slug } },
        });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const lastProject = await prisma.collectivePortfolioProject.findFirst({
        where: { collectiveId: input.collectiveId },
        orderBy: { sortOrder: "desc" },
      });

      const project = await prisma.collectivePortfolioProject.create({
        data: {
          collectiveId: input.collectiveId,
          createdById: ctx.user.id,
          title: input.title,
          slug,
          description: input.description,
          coverUrl: input.coverUrl,
          category: input.category,
          tags: input.tags || [],
          layout: input.layout,
          sortOrder: (lastProject?.sortOrder ?? -1) + 1,
        },
      });

      return project;
    }),

  updateCollectiveProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        title: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).optional().nullable(),
        coverUrl: z.string().url().optional().nullable(),
        category: z.string().max(50).optional().nullable(),
        tags: z.array(z.string().max(30)).max(15).optional(),
        layout: z.nativeEnum(PortfolioLayout).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.collectivePortfolioProject.findUnique({ where: { id: input.projectId } });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const member = await getMemberWithRole(project.collectiveId, ctx.user.id);
      requirePermission(member, "canEditPortfolio");

      const { projectId, ...data } = input;

      let newSlug = project.slug;
      if (data.title && data.title !== project.title) {
        const baseSlug = generateSlug(data.title);
        newSlug = baseSlug;
        let counter = 1;
        while (true) {
          const existing = await prisma.collectivePortfolioProject.findUnique({
            where: { collectiveId_slug: { collectiveId: project.collectiveId, slug: newSlug } },
          });
          if (!existing || existing.id === projectId) break;
          newSlug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      const updated = await prisma.collectivePortfolioProject.update({
        where: { id: projectId },
        data: { ...data, slug: newSlug },
      });

      return updated;
    }),

  deleteCollectiveProject: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: projectId }) => {
      const project = await prisma.collectivePortfolioProject.findUnique({ where: { id: projectId } });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const member = await getMemberWithRole(project.collectiveId, ctx.user.id);
      requirePermission(member, "canEditPortfolio");

      await prisma.collectivePortfolioProject.delete({ where: { id: projectId } });
      return { success: true };
    }),

  getCollectiveProjects: publicProcedure
    .input(
      z.object({
        collectiveId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(COLLECTIVE_LIMITS.PORTFOLIO_PAGE_SIZE),
      })
    )
    .query(async ({ input, ctx }) => {
      const collective = await prisma.collective.findUnique({ where: { id: input.collectiveId } });
      if (!collective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
      }

      if (collective.visibility === "PRIVATE") {
        if (!ctx.user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
        }
        await requireMembership(input.collectiveId, ctx.user.id);
      }

      const projects = await prisma.collectivePortfolioProject.findMany({
        where: { collectiveId: input.collectiveId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { sortOrder: "asc" },
        include: {
          createdBy: {
            include: { profile: { select: profileSelect } },
          },
          _count: { select: { blocks: true } },
        },
      });

      let nextCursor: string | undefined;
      if (projects.length > input.limit) {
        const next = projects.pop();
        nextCursor = next?.id;
      }

      return { projects, nextCursor };
    }),

  getCollectiveProjectBySlug: publicProcedure
    .input(
      z.object({
        collectiveSlug: z.string(),
        projectSlug: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const collective = await prisma.collective.findUnique({ where: { slug: input.collectiveSlug } });
      if (!collective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
      }

      if (collective.visibility === "PRIVATE") {
        if (!ctx.user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Collective not found" });
        }
        await requireMembership(collective.id, ctx.user.id);
      }

      const project = await prisma.collectivePortfolioProject.findUnique({
        where: { collectiveId_slug: { collectiveId: collective.id, slug: input.projectSlug } },
        include: {
          createdBy: {
            include: { profile: { select: profileSelect } },
          },
          blocks: {
            orderBy: { sortOrder: "asc" },
            include: {
              contributor: {
                include: { profile: { select: profileSelect } },
              },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Increment view count
      await prisma.collectivePortfolioProject.update({
        where: { id: project.id },
        data: { viewCount: { increment: 1 } },
      });

      return { ...project, collective: { name: collective.name, slug: collective.slug } };
    }),

  addCollectiveBlock: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        type: z.nativeEnum(PortfolioBlockType),
        content: z.record(z.any()),
        contributorId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.collectivePortfolioProject.findUnique({ where: { id: input.projectId } });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const member = await getMemberWithRole(project.collectiveId, ctx.user.id);
      requirePermission(member, "canEditPortfolio");

      const lastBlock = await prisma.collectivePortfolioBlock.findFirst({
        where: { projectId: input.projectId },
        orderBy: { sortOrder: "desc" },
      });

      const block = await prisma.collectivePortfolioBlock.create({
        data: {
          projectId: input.projectId,
          type: input.type,
          content: input.content,
          contributorId: input.contributorId,
          sortOrder: (lastBlock?.sortOrder ?? -1) + 1,
        },
      });

      return block;
    }),

  updateCollectiveBlock: protectedProcedure
    .input(
      z.object({
        blockId: z.string().uuid(),
        type: z.nativeEnum(PortfolioBlockType).optional(),
        content: z.record(z.any()).optional(),
        contributorId: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const block = await prisma.collectivePortfolioBlock.findUnique({
        where: { id: input.blockId },
        include: { project: true },
      });
      if (!block) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Block not found" });
      }

      const member = await getMemberWithRole(block.project.collectiveId, ctx.user.id);
      requirePermission(member, "canEditPortfolio");

      const { blockId, ...data } = input;
      const updated = await prisma.collectivePortfolioBlock.update({
        where: { id: blockId },
        data,
      });

      return updated;
    }),

  deleteCollectiveBlock: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: blockId }) => {
      const block = await prisma.collectivePortfolioBlock.findUnique({
        where: { id: blockId },
        include: { project: true },
      });
      if (!block) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Block not found" });
      }

      const member = await getMemberWithRole(block.project.collectiveId, ctx.user.id);
      requirePermission(member, "canEditPortfolio");

      await prisma.collectivePortfolioBlock.delete({ where: { id: blockId } });
      return { success: true };
    }),

  reorderCollectiveBlocks: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        blocks: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.collectivePortfolioProject.findUnique({ where: { id: input.projectId } });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const member = await getMemberWithRole(project.collectiveId, ctx.user.id);
      requirePermission(member, "canEditPortfolio");

      await prisma.$transaction(
        input.blocks.map((b) =>
          prisma.collectivePortfolioBlock.update({
            where: { id: b.id },
            data: { sortOrder: b.sortOrder },
          })
        )
      );

      return { success: true };
    }),
});
