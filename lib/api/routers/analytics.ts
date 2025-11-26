import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { startOfMonth, endOfMonth, subMonths, eachDayOfInterval, format } from 'date-fns';

export const analyticsRouter = router({
  // Overview Stats - Optimized
  getOverviewStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get all opportunities in a single query
    const allOpportunities = await ctx.prisma.projectOpportunity.findMany({
      where: {
        project: { userId },
      },
      select: {
        status: true,
        opportunity: {
          select: {
            domainAuthority: true,
            domainRating: true,
            isDofollow: true,
          },
        },
      },
    });

    // Calculate everything in memory
    let totalOpportunities = allOpportunities.length;
    let approvedLinks = 0;
    let submittedLinks = 0;
    let rejectedLinks = 0;
    let inProgressLinks = 0;
    let totalDA = 0;
    let totalDR = 0;
    let dofollowCount = 0;
    let nofollowCount = 0;
    let approvedCount = 0;

    allOpportunities.forEach((opp) => {
      switch (opp.status) {
        case 'APPROVED':
          approvedLinks++;
          totalDA += opp.opportunity.domainAuthority || 0;
          totalDR += opp.opportunity.domainRating || 0;
          if (opp.opportunity.isDofollow) dofollowCount++;
          else nofollowCount++;
          approvedCount++;
          break;
        case 'SUBMITTED':
          submittedLinks++;
          break;
        case 'REJECTED':
          rejectedLinks++;
          break;
        case 'IN_PROGRESS':
          inProgressLinks++;
          break;
      }
    });

    const totalSubmissions = submittedLinks + approvedLinks + rejectedLinks;
    const successRate = totalSubmissions > 0 ? (approvedLinks / totalSubmissions) * 100 : 0;
    const avgDA = approvedCount > 0 ? totalDA / approvedCount : 0;
    const avgDR = approvedCount > 0 ? totalDR / approvedCount : 0;

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

    // Optimized query - fetch everything in one go
    const topOpportunities = await ctx.prisma.projectOpportunity.findMany({
      where: {
        project: { userId },
        status: 'APPROVED',
      },
      select: {
        opportunityId: true,
        opportunity: {
          select: {
            id: true,
            siteName: true,
            category: true,
            domainAuthority: true,
            domainRating: true,
            isDofollow: true,
          },
        },
      },
    });

    // Count and aggregate in memory
    const countMap = new Map<string, { opportunity: any; count: number }>();
    
    topOpportunities.forEach((item) => {
      const existing = countMap.get(item.opportunityId);
      if (existing) {
        existing.count++;
      } else {
        countMap.set(item.opportunityId, {
          opportunity: item.opportunity,
          count: 1,
        });
      }
    });

    // Sort and return top 10
    return Array.from(countMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        ...item.opportunity,
        count: item.count,
      }));
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
