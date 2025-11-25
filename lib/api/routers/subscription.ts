import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const subscriptionRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
      include: { plan: true },
    });

    return subscription;
  }),

  getPlans: protectedProcedure.query(async ({ ctx }) => {
    const plans = await ctx.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });

    return plans;
  }),

  listPlans: protectedProcedure.query(async ({ ctx }) => {
    const plans = await ctx.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });

    return plans;
  }),

  updateSubscription: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!subscription) {
        // Create new subscription if doesn't exist
        await ctx.prisma.subscription.create({
          data: {
            userId: ctx.user.id,
            planId: input.planId,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });
      } else {
        // Update existing subscription
        await ctx.prisma.subscription.update({
          where: { userId: ctx.user.id },
          data: {
            planId: input.planId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return { success: true };
    }),

  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
      include: { plan: true },
    });

    if (!subscription) {
      return null;
    }

    const projectCount = await ctx.prisma.project.count({
      where: { userId: ctx.user.id },
    });

    const opportunityCount = await ctx.prisma.projectOpportunity.count({
      where: {
        project: { userId: ctx.user.id },
      },
    });

    return {
      projects: {
        used: projectCount,
        limit: subscription.plan.maxProjects,
      },
      opportunities: {
        used: opportunityCount,
        limit: subscription.plan.maxOpportunities,
      },
    };
  }),
});