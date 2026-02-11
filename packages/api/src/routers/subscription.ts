import { z } from "zod";
import { prisma, SubscriptionTier } from "@ekko/database";
import { SUBSCRIPTION_TIERS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";

export const subscriptionRouter = router({
  getCurrentTier: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: ctx.user.id },
      select: { subscriptionTier: true, subscribedAt: true },
    });

    const tier = (profile?.subscriptionTier || "FREE") as keyof typeof SUBSCRIPTION_TIERS;
    return {
      tier,
      limits: SUBSCRIPTION_TIERS[tier],
      subscribedAt: profile?.subscribedAt,
    };
  }),

  upgrade: protectedProcedure
    .input(z.nativeEnum(SubscriptionTier))
    .mutation(async ({ ctx, input: tier }) => {
      const profile = await prisma.profile.update({
        where: { userId: ctx.user.id },
        data: {
          subscriptionTier: tier,
          subscribedAt: new Date(),
        },
      });
      return { tier: profile.subscriptionTier };
    }),

  downgrade: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await prisma.profile.update({
      where: { userId: ctx.user.id },
      data: {
        subscriptionTier: "FREE",
        subscribedAt: null,
      },
    });
    return { tier: profile.subscriptionTier };
  }),
});
