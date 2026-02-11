import { z } from "zod";
import { prisma, AvailabilityStatus, Prisma } from "@ekko/database";
import { LIMITS } from "@ekko/config";

import { router, publicProcedure } from "../trpc";

const searchCreativesSchema = z.object({
  query: z.string().optional(),
  disciplines: z.array(z.string().uuid()).optional(),
  location: z.string().optional(),
  availability: z.nativeEnum(AvailabilityStatus).optional(),
  rateMin: z.number().min(0).optional(),
  rateMax: z.number().max(10000).optional(),
  sortBy: z.enum(["relevance", "newest"]).default("relevance"),
  cursor: z.string().uuid().optional(),
  limit: z.number().min(1).max(50).default(LIMITS.SEARCH_PAGE_SIZE),
});

export const searchRouter = router({
  searchCreatives: publicProcedure
    .input(searchCreativesSchema)
    .query(async ({ input }) => {
      const {
        query,
        disciplines,
        location,
        availability,
        rateMin,
        rateMax,
        sortBy,
        cursor,
        limit,
      } = input;

      // Build where clause
      const where: Prisma.ProfileWhereInput = {
        user: {
          role: "CREATIVE",
          status: "ACTIVE",
        },
      };

      // Full-text search on displayName, bio, headline
      if (query && query.length > 0) {
        where.OR = [
          { displayName: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
          { headline: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ];
      }

      // Filter by disciplines
      if (disciplines && disciplines.length > 0) {
        where.disciplines = {
          some: {
            disciplineId: { in: disciplines },
          },
        };
      }

      // Filter by location
      if (location) {
        where.OR = [
          ...(where.OR || []),
          { location: { contains: location, mode: "insensitive" } },
          { country: { contains: location, mode: "insensitive" } },
        ];
      }

      // Filter by availability
      if (availability) {
        where.availability = availability;
      }

      // Filter by rate range
      if (rateMin !== undefined) {
        where.hourlyRateMin = { gte: rateMin };
      }
      if (rateMax !== undefined) {
        where.hourlyRateMax = { lte: rateMax };
      }

      // Determine sort order
      const orderBy: Prisma.ProfileOrderByWithRelationInput =
        sortBy === "newest"
          ? { createdAt: "desc" }
          : { verificationStatus: "desc" }; // Prioritize verified users for relevance

      const profiles = await prisma.profile.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              role: true,
              createdAt: true,
            },
          },
          disciplines: {
            include: {
              discipline: true,
            },
          },
          skills: {
            take: 5,
            include: {
              skill: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (profiles.length > limit) {
        const nextItem = profiles.pop();
        nextCursor = nextItem?.id;
      }

      return {
        profiles,
        nextCursor,
      };
    }),

  getDisciplines: publicProcedure.query(async () => {
    const disciplines = await prisma.discipline.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return disciplines;
  }),

  getSkills: publicProcedure.query(async () => {
    const skills = await prisma.skill.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return skills;
  }),

  getSkillsByCategory: publicProcedure
    .input(z.string())
    .query(async ({ input: category }) => {
      const skills = await prisma.skill.findMany({
        where: { category },
        orderBy: { name: "asc" },
      });

      return skills;
    }),

  searchPosts: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        tag: z.string().optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.FEED_PAGE_SIZE),
      })
    )
    .query(async ({ input }) => {
      const { query, tag, cursor, limit } = input;

      const posts = await prisma.post.findMany({
        where: {
          ...(tag
            ? { tags: { has: tag.toLowerCase() } }
            : { content: { contains: query, mode: "insensitive" } }),
          OR: [
            { collectiveId: null },
            { collectiveVisibility: "BOTH" },
          ],
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  verificationStatus: true,
                  subscriptionTier: true,
                },
              },
            },
          },
          collective: { select: { name: true, slug: true } },
          blocks: { orderBy: { sortOrder: "asc" } },
          likes: { select: { userId: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      const transformedPosts = posts.map((post) => ({
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      }));

      return { posts: transformedPosts, nextCursor };
    }),

  searchCollectives: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(12),
      })
    )
    .query(async ({ input }) => {
      const { query, cursor, limit } = input;

      const collectives = await prisma.collective.findMany({
        where: {
          visibility: "PUBLIC",
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { membersCount: "desc" },
        include: {
          _count: { select: { members: true } },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (collectives.length > limit) {
        const nextItem = collectives.pop();
        nextCursor = nextItem?.id;
      }

      return { collectives, nextCursor };
    }),
});
