import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";
import { CONNECT_LIMITS, CONNECT_TIERS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";

const mediaSlotSchema = z.object({
  url: z.string().url(),
  mediaType: z.enum(["PHOTO", "VIDEO", "AUDIO", "MODEL"]),
  sortOrder: z.number().int().min(0).max(5),
});

const promptSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1).max(CONNECT_LIMITS.PROMPT_ANSWER_MAX),
});

export const connectProfileRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.connectProfile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        user: {
          include: {
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
                bannerUrl: true,
                bio: true,
                headline: true,
                location: true,
                verificationStatus: true,
                subscriptionTier: true,
                disciplines: {
                  include: { discipline: true },
                },
              },
            },
          },
        },
      },
    });

    return profile;
  }),

  getById: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: profileId }) => {
      const profile = await prisma.connectProfile.findUnique({
        where: { id: profileId },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  bannerUrl: true,
                  bio: true,
                  headline: true,
                  location: true,
                  verificationStatus: true,
                  subscriptionTier: true,
                  disciplines: {
                    include: { discipline: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }

      return profile;
    }),

  create: protectedProcedure
    .input(
      z.object({
        headline: z.string().max(CONNECT_LIMITS.HEADLINE_MAX).optional(),
        lookingFor: z.string().max(CONNECT_LIMITS.LOOKING_FOR_MAX).optional(),
        bio: z.string().max(CONNECT_LIMITS.BIO_MAX).optional(),
        mediaSlots: z
          .array(mediaSlotSchema)
          .min(CONNECT_LIMITS.MIN_MEDIA_SLOTS)
          .max(CONNECT_LIMITS.MAX_MEDIA_SLOTS),
        prompts: z
          .array(promptSchema)
          .min(CONNECT_LIMITS.MIN_PROMPTS)
          .max(CONNECT_LIMITS.MAX_PROMPTS),
        instagramHandle: z.string().max(100).optional(),
        twitterHandle: z.string().max(100).optional(),
        websiteUrl: z.string().url().max(500).optional().or(z.literal("")),
        disciplineIds: z.array(z.string().uuid()).optional(),
        location: z.string().max(200).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if profile already exists
      const existing = await prisma.connectProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Connect profile already exists. Use update instead.",
        });
      }

      const profile = await prisma.connectProfile.create({
        data: {
          userId: ctx.user.id,
          headline: input.headline,
          lookingFor: input.lookingFor,
          bio: input.bio,
          mediaSlots: input.mediaSlots,
          prompts: input.prompts,
          instagramHandle: input.instagramHandle,
          twitterHandle: input.twitterHandle,
          websiteUrl: input.websiteUrl || null,
          disciplineIds: input.disciplineIds || [],
          location: input.location,
          latitude: input.latitude,
          longitude: input.longitude,
        },
      });

      return profile;
    }),

  update: protectedProcedure
    .input(
      z.object({
        headline: z.string().max(CONNECT_LIMITS.HEADLINE_MAX).optional(),
        lookingFor: z.string().max(CONNECT_LIMITS.LOOKING_FOR_MAX).optional(),
        bio: z.string().max(CONNECT_LIMITS.BIO_MAX).optional(),
        mediaSlots: z
          .array(mediaSlotSchema)
          .min(CONNECT_LIMITS.MIN_MEDIA_SLOTS)
          .max(CONNECT_LIMITS.MAX_MEDIA_SLOTS)
          .optional(),
        prompts: z
          .array(promptSchema)
          .min(CONNECT_LIMITS.MIN_PROMPTS)
          .max(CONNECT_LIMITS.MAX_PROMPTS)
          .optional(),
        instagramHandle: z.string().max(100).optional(),
        twitterHandle: z.string().max(100).optional(),
        websiteUrl: z.string().url().max(500).optional().or(z.literal("")),
        disciplineIds: z.array(z.string().uuid()).optional(),
        location: z.string().max(200).optional(),
        latitude: z.number().min(-90).max(90).nullable().optional(),
        longitude: z.number().min(-180).max(180).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.connectProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Connect profile not found. Create one first.",
        });
      }

      // Validate media slots against tier limit
      if (input.mediaSlots) {
        const maxSlots =
          existing.connectTier === "INFINITE"
            ? CONNECT_TIERS.INFINITE.maxMediaSlots
            : CONNECT_TIERS.FREE.maxMediaSlots;
        if (input.mediaSlots.length > maxSlots) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Your plan allows up to ${maxSlots} media slots. Upgrade for more!`,
          });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (input.headline !== undefined) updateData.headline = input.headline;
      if (input.lookingFor !== undefined) updateData.lookingFor = input.lookingFor;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.mediaSlots !== undefined) updateData.mediaSlots = input.mediaSlots;
      if (input.prompts !== undefined) updateData.prompts = input.prompts;
      if (input.instagramHandle !== undefined) updateData.instagramHandle = input.instagramHandle;
      if (input.twitterHandle !== undefined) updateData.twitterHandle = input.twitterHandle;
      if (input.websiteUrl !== undefined) updateData.websiteUrl = input.websiteUrl || null;
      if (input.disciplineIds !== undefined) updateData.disciplineIds = input.disciplineIds;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.latitude !== undefined) updateData.latitude = input.latitude;
      if (input.longitude !== undefined) updateData.longitude = input.longitude;

      const profile = await prisma.connectProfile.update({
        where: { userId: ctx.user.id },
        data: updateData,
      });

      return profile;
    }),

  disconnectInstagram: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.connectProfile.update({
      where: { userId: ctx.user.id },
      data: {
        instagramAccessToken: null,
        instagramTokenExpiry: null,
        instagramUserId: null,
        instagramHandle: null,
      },
    });
    return { success: true };
  }),

  toggleActive: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await prisma.connectProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Connect profile not found.",
      });
    }

    const updated = await prisma.connectProfile.update({
      where: { userId: ctx.user.id },
      data: { isActive: !profile.isActive },
    });

    return { isActive: updated.isActive };
  }),
});
