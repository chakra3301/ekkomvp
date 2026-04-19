import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";
import { CONNECT_LIMITS, CONNECT_TIERS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";
import { assertCleanContent } from "../lib/content-filter";

const mediaSlotSchema = z.object({
  url: z.string().min(1),
  mediaType: z.enum(["PHOTO", "VIDEO", "AUDIO", "MODEL"]),
  sortOrder: z.number().int().min(0).max(11),
  // Optional caption displayed by templates that use per-slot titles
  // (e.g. Editorial). Older slots without a title decode as undefined.
  title: z.string().max(100).optional(),
});

const promptSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1).max(CONNECT_LIMITS.PROMPT_ANSWER_MAX),
});

const profileTemplateSchema = z.enum(["DEFAULT", "HERO", "EDITORIAL", "STACK"]);

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
        websiteUrl: z.string().max(500).optional().or(z.literal("")),
        disciplineIds: z.array(z.string().uuid()).optional(),
        location: z.string().max(200).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        profileTemplate: profileTemplateSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertCleanContent(input.headline);
      assertCleanContent(input.bio);
      assertCleanContent(input.lookingFor);

      // New profiles start on the FREE tier — enforce that plan's slot ceiling
      // so a client can't smuggle in 12 slots at creation time.
      if (input.mediaSlots.length > CONNECT_TIERS.FREE.maxMediaSlots) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Your plan allows up to ${CONNECT_TIERS.FREE.maxMediaSlots} media slots. Upgrade for more!`,
        });
      }

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
          profileTemplate: input.profileTemplate,
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
        websiteUrl: z.string().max(500).optional().or(z.literal("")),
        disciplineIds: z.array(z.string().uuid()).optional(),
        location: z.string().max(200).optional(),
        latitude: z.number().min(-90).max(90).nullable().optional(),
        longitude: z.number().min(-180).max(180).nullable().optional(),
        profileTemplate: profileTemplateSchema.nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertCleanContent(input.headline);
      assertCleanContent(input.bio);
      assertCleanContent(input.lookingFor);

      // Read tier + validate + write in one transaction so tier can't shift under us.
      const profile = await prisma.$transaction(async (tx) => {
        const existing = await tx.connectProfile.findUnique({
          where: { userId: ctx.user.id },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Connect profile not found. Create one first.",
          });
        }

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
        if (input.profileTemplate !== undefined) updateData.profileTemplate = input.profileTemplate;

        return tx.connectProfile.update({
          where: { userId: ctx.user.id },
          data: updateData,
        });
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

  // Called by the client after a successful IAP to sync tier
  upgradeTier: protectedProcedure
    .input(z.enum(["FREE", "INFINITE"]))
    .mutation(async ({ ctx, input: tier }) => {
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
        data: { connectTier: tier },
      });

      return { connectTier: updated.connectTier };
    }),
});
