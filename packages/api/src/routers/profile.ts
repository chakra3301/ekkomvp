import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma, AvailabilityStatus, Prisma } from "@ekko/database";
import { LIMITS } from "@ekko/config";

import { router, publicProcedure, protectedProcedure } from "../trpc";

const profileUpdateSchema = z.object({
  displayName: z.string().min(LIMITS.DISPLAY_NAME_MIN_LENGTH).max(LIMITS.DISPLAY_NAME_MAX_LENGTH),
  username: z
    .string()
    .min(LIMITS.USERNAME_MIN_LENGTH)
    .max(LIMITS.USERNAME_MAX_LENGTH)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  bio: z.string().max(LIMITS.BIO_MAX_LENGTH).optional().nullable(),
  headline: z.string().max(LIMITS.HEADLINE_MAX_LENGTH).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  instagramUrl: z.string().url().optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  twitterUrl: z.string().url().optional().nullable().or(z.literal("")),
  tiktokUrl: z.string().url().optional().nullable().or(z.literal("")),
  hourlyRateMin: z.number().min(0).max(10000).optional().nullable(),
  hourlyRateMax: z.number().min(0).max(10000).optional().nullable(),
  availability: z.nativeEnum(AvailabilityStatus).optional(),
  // Client fields
  companyName: z.string().max(100).optional().nullable(),
  companyDescription: z.string().max(500).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  // Profile customization
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  pageBackground: z.object({
    type: z.enum(["solid", "gradient", "image"]),
    value: z.string().max(500),
  }).optional().nullable(),
});

const skillsUpdateSchema = z.object({
  skills: z.array(
    z.object({
      skillId: z.string().uuid(),
      proficiency: z.number().min(1).max(5),
    })
  ),
});

const disciplinesUpdateSchema = z.object({
  disciplines: z.array(
    z.object({
      disciplineId: z.string().uuid(),
      isPrimary: z.boolean().default(false),
    })
  ),
});

export const profileRouter = router({
  getByUsername: publicProcedure
    .input(z.string())
    .query(async ({ input: username }) => {
      const profile = await prisma.profile.findUnique({
        where: { username },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
              createdAt: true,
            },
          },
          skills: {
            include: {
              skill: true,
            },
          },
          disciplines: {
            include: {
              discipline: true,
            },
          },
        },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }

      return profile;
    }),

  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        disciplines: {
          include: {
            discipline: true,
          },
        },
      },
    });

    return profile;
  }),

  update: protectedProcedure
    .input(profileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if username is taken by another user
      if (input.username) {
        const existingProfile = await prisma.profile.findFirst({
          where: {
            username: input.username,
            NOT: { userId: ctx.user.id },
          },
        });

        if (existingProfile) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username is already taken",
          });
        }
      }

      const { pageBackground, ...rest } = input;
      const pgBg = pageBackground === null
        ? Prisma.JsonNull
        : pageBackground === undefined
          ? undefined
          : pageBackground;

      const profile = await prisma.profile.upsert({
        where: { userId: ctx.user.id },
        update: {
          ...rest,
          website: rest.website || null,
          instagramUrl: rest.instagramUrl || null,
          linkedinUrl: rest.linkedinUrl || null,
          twitterUrl: rest.twitterUrl || null,
          tiktokUrl: rest.tiktokUrl || null,
          pageBackground: pgBg,
        },
        create: {
          userId: ctx.user.id,
          ...rest,
          website: rest.website || null,
          instagramUrl: rest.instagramUrl || null,
          linkedinUrl: rest.linkedinUrl || null,
          twitterUrl: rest.twitterUrl || null,
          tiktokUrl: rest.tiktokUrl || null,
          pageBackground: pgBg,
        },
      });

      // Mark user as onboarded
      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { onboarded: true },
      });

      return profile;
    }),

  updateAvatar: protectedProcedure
    .input(z.object({ avatarUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.profile.update({
        where: { userId: ctx.user.id },
        data: { avatarUrl: input.avatarUrl },
      });

      return profile;
    }),

  updateBanner: protectedProcedure
    .input(z.object({ bannerUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.profile.update({
        where: { userId: ctx.user.id },
        data: { bannerUrl: input.bannerUrl },
      });

      return profile;
    }),

  updateSkills: protectedProcedure
    .input(skillsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.profile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }

      // Delete existing skills
      await prisma.profileSkill.deleteMany({
        where: { profileId: profile.id },
      });

      // Add new skills
      await prisma.profileSkill.createMany({
        data: input.skills.map((skill) => ({
          profileId: profile.id,
          skillId: skill.skillId,
          proficiency: skill.proficiency,
        })),
      });

      return prisma.profile.findUnique({
        where: { id: profile.id },
        include: {
          skills: {
            include: { skill: true },
          },
        },
      });
    }),

  updateDisciplines: protectedProcedure
    .input(disciplinesUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.profile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }

      // Ensure only one primary discipline
      const primaryCount = input.disciplines.filter((d) => d.isPrimary).length;
      if (primaryCount > 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only one primary discipline is allowed",
        });
      }

      // Delete existing disciplines
      await prisma.profileDiscipline.deleteMany({
        where: { profileId: profile.id },
      });

      // Add new disciplines
      await prisma.profileDiscipline.createMany({
        data: input.disciplines.map((disc) => ({
          profileId: profile.id,
          disciplineId: disc.disciplineId,
          isPrimary: disc.isPrimary,
        })),
      });

      return prisma.profile.findUnique({
        where: { id: profile.id },
        include: {
          disciplines: {
            include: { discipline: true },
          },
        },
      });
    }),

  checkUsername: publicProcedure
    .input(z.string().min(3).max(30))
    .query(async ({ input: username }) => {
      const existingProfile = await prisma.profile.findUnique({
        where: { username },
      });

      return {
        available: !existingProfile,
        username,
      };
    }),

  getSuggestedFollows: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await prisma.profile.findMany({
      where: {
        userId: { not: ctx.user.id },
      },
      orderBy: { followersCount: "desc" },
      take: 8,
      select: {
        username: true,
        displayName: true,
        avatarUrl: true,
        headline: true,
        followersCount: true,
        user: { select: { id: true } },
      },
    });
    return profiles;
  }),

  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        likes: z.boolean(),
        comments: z.boolean(),
        follows: z.boolean(),
        messages: z.boolean(),
        workOrders: z.boolean(),
        collectives: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.profile.update({
        where: { userId: ctx.user.id },
        data: { notificationPreferences: input },
      });

      return profile;
    }),
});
