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