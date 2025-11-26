import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { startOfMonth, endOfMonth, subMonths, eachDayOfInterval, format } from 'date-fns';

export const analyticsRouter = router({
  // Overview Stats
  getOverviewStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get total backlinks by status
    const totalOpportunities = await ctx.prisma.projectOpportunity.count({
      where: {
        project: { userId },
      },
    });

    const approvedLinks = await ctx.prisma.projectOpportunity.count({
      where: {
        project: { userId },
        status: 'APPROVED',
      },
    });

    const submittedLinks = await ctx.prisma.projectOpportunity.count({
      where: {
        project: { userId },
        status: 'SUBMITTED',
      },
    });

    const rejectedLinks = await ctx.prisma.projectOpportunity.count({
      where: {
        project: { userId },
        status: 'REJECTED',
      },
    });

    const inProgressLinks = await ctx.prisma.projectOpportunity.count({
      where: {
        project: { userId },
        status: 'IN_PROGRESS',
      },
    });

    // Calculate success rate
    const totalSubmissions = submittedLinks + approvedLinks + rejectedLinks;
    const successRate = totalSubmissions > 0 ? (approvedLinks / totalSubmissions) * 100 : 0;

    // Get average DA/DR
    const opportunities = await ctx.prisma.projectOpportunity.findMany({
      where: {
        project: { userId },
        status: 'APPROVED',
      },
      include: {
        opportunity: true,
      },
    });

    const avgDA = opportunities.length > 0
      ? opportunities.reduce((sum, o) => sum + (o.opportunity.domainAuthority || 0), 0) / opportunities.length
      : 0;

    const avgDR = opportunities.length > 0
      ? opportunities.reduce((sum, o) => sum + (o.opportunity.domainRating || 0), 0) / opportunities.length
      : 0;

    // Dofollow vs Nofollow
    const dofollowCount = opportunities.filter(o => o.opportunity.isDofollow).length;
    const nofollowCount = opportunities.length - dofollowCount;

    return {
      totalOpportunities,
      approvedLinks,
      submittedLinks,
      rejectedLinks,
      inProgressLinks,
      successRate: Math.round(successRate * 10) / 10,
      avgDA: Math.round(avgDA),
      avgDR: Math.round(avgDR),
      dofollowCount,
      nofollowCount,
    };
  }),

  // Timeline Data (last 6 months)
  getTimelineData: protectedProcedure
    .input(
      z.object({
        months: z.number().default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const startDate = subMonths(new Date(), input.months);

      const opportunities = await ctx.prisma.projectOpportunity.findMany({
        where: {
          project: { userId },
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
      });

      // Group by month
      const monthlyData: { [key: string]: { approved: number; submitted: number; rejected: number; inProgress: number } } = {};

      opportunities.forEach((opp) => {
        const monthKey = format(opp.createdAt, 'MMM yyyy');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { approved: 0, submitted: 0, rejected: 0, inProgress: 0 };
        }

        if (opp.status === 'APPROVED') monthlyData[monthKey].approved++;
        else if (opp.status === 'SUBMITTED') monthlyData[monthKey].submitted++;
        else if (opp.status === 'REJECTED') monthlyData[monthKey].rejected++;
        else if (opp.status === 'IN_PROGRESS') monthlyData[monthKey].inProgress++;
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data,
      }));
    }),

  // Link Type Distribution
  getLinkTypeDistribution: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const opportunities = await ctx.prisma.projectOpportunity.findMany({
      where: {
        project: { userId },
        status: 'APPROVED',
      },
      include: {
        opportunity: true,
      },
    });

    const distribution: { [key: string]: number } = {};

    opportunities.forEach((opp) => {
      const type = opp.opportunity.linkType;
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value,
    }));
  }),

  // Niche Distribution
  getNicheDistribution: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const opportunities = await ctx.prisma.projectOpportunity.findMany({
      where: {
        project: { userId },
        status: 'APPROVED',
      },
      include: {
        opportunity: true,
      },
    });

    const distribution: { [key: string]: number } = {};

    opportunities.forEach((opp) => {
      const niche = opp.opportunity.niche;
      distribution[niche] = (distribution[niche] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }),

  // Top Performing Opportunities
  getTopOpportunities: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const opportunities = await ctx.prisma.projectOpportunity.groupBy({
      by: ['opportunityId'],
      where: {
        project: { userId },
        status: 'APPROVED',
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const topOppsWithDetails = await Promise.all(
      opportunities.map(async (opp) => {
        const opportunity = await ctx.prisma.backlinkOpportunity.findUnique({
          where: { id: opp.opportunityId },
        });
        return {
          ...opportunity,
          count: opp._count.id,
        };
      })
    );

    return topOppsWithDetails;
  }),

  // Recent Activity
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const activities = await ctx.prisma.projectOpportunity.findMany({
        where: {
          project: { userId },
        },
        include: {
          opportunity: true,
          project: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: input.limit,
      });

      return activities;
    }),

  // Project Performance Comparison
  getProjectPerformance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const projects = await ctx.prisma.project.findMany({
      where: { userId },
      include: {
        opportunities: {
          select: {
            status: true,
          },
        },
      },
    });

    return projects.map((project) => {
      const total = project.opportunities.length;
      const approved = project.opportunities.filter((o) => o.status === 'APPROVED').length;
      const completionRate = total > 0 ? (approved / total) * 100 : 0;

      return {
        name: project.name,
        total,
        approved,
        completionRate: Math.round(completionRate),
      };
    });
  }),

  // Export Analytics Data
  exportAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const opportunities = await ctx.prisma.projectOpportunity.findMany({
      where: {
        project: { userId },
      },
      include: {
        opportunity: true,
        project: true,
      },
    });

    return opportunities;
  }),
});
