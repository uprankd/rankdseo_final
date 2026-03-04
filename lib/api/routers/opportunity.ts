import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

export const opportunityRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(2000).optional().default(100),
        cursor: z.string().optional(),
        search: z.string().optional(),
        category: z.array(z.string()).optional(),
        niche: z.array(z.string()).optional(),
        linkType: z.array(z.string()).optional(),
        language: z.string().optional(),
        country: z.string().optional(),
        isFree: z.boolean().optional(),
        isDofollow: z.boolean().optional(),
        minDA: z.number().optional(),
        maxDA: z.number().optional(),
        sortBy: z.enum(['relevance', 'da', 'dr', 'traffic', 'date']).optional().default('relevance'),
      })
    )
    .query(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { userId: ctx.user.id },
        include: { plan: true },
      });

      if (!subscription) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No active subscription' });
      }

      const where: Prisma.BacklinkOpportunityWhereInput = {
        status: 'ACTIVE',
        ...(input.search && {
          OR: [
            { siteName: { contains: input.search, mode: 'insensitive' } },
            { shortDescription: { contains: input.search, mode: 'insensitive' } },
            { category: { contains: input.search, mode: 'insensitive' } },
          ],
        }),
        ...(input.category && input.category.length > 0 && {
          category: { in: input.category },
        }),
        ...(input.niche && input.niche.length > 0 && {
          niche: { in: input.niche },
        }),
        ...(input.linkType && input.linkType.length > 0 && {
          linkType: { in: input.linkType as any[] },
        }),
        ...(input.language && { language: input.language }),
        ...(input.country && { country: input.country }),
        ...(input.isFree !== undefined && { isFree: input.isFree }),
        ...(input.isDofollow !== undefined && { isDofollow: input.isDofollow }),
        ...(input.minDA && { domainAuthority: { gte: input.minDA } }),
        ...(input.maxDA && { domainAuthority: { lte: input.maxDA } }),
      };

      let orderBy: any = { createdAt: 'desc' };
      if (input.sortBy === 'da') orderBy = { domainAuthority: 'desc' };
      if (input.sortBy === 'dr') orderBy = { domainRating: 'desc' };
      if (input.sortBy === 'traffic') orderBy = { estimatedTraffic: 'desc' };
      if (input.sortBy === 'date') orderBy = { createdAt: 'desc' };

      // Check if user is on Free plan
      const isFreePlan = subscription.plan.price === 0;
      // Admin users and lifetime subscribers get unlimited access
      const isAdmin = ctx.user.role === 'ADMIN';
      const isLifetime = subscription.plan.interval === 'lifetime';
      const shouldHaveUnlimitedAccess = isAdmin || isLifetime;

      // For FREE plan users: return 50 random opportunities
      if (isFreePlan && !isAdmin) {
        // Get all opportunity IDs first
        const allOpportunityIds = await ctx.prisma.backlinkOpportunity.findMany({
          where,
          select: { id: true },
        });

        // Shuffle and take 50 random IDs
        const shuffled = allOpportunityIds
          .map(o => ({ id: o.id, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .slice(0, 50)
          .map(o => o.id);

        // Fetch the full opportunity data for these IDs
        const opportunities = await ctx.prisma.backlinkOpportunity.findMany({
          where: { id: { in: shuffled } },
          include: {
            _count: {
              select: { instructions: true },
            },
          },
        });

        // Sort by the requested order
        if (input.sortBy === 'da') {
          opportunities.sort((a, b) => (b.domainAuthority || 0) - (a.domainAuthority || 0));
        } else if (input.sortBy === 'dr') {
          opportunities.sort((a, b) => (b.domainRating || 0) - (a.domainRating || 0));
        } else if (input.sortBy === 'traffic') {
          opportunities.sort((a, b) => (b.estimatedTraffic || 0) - (a.estimatedTraffic || 0));
        }

        // Get total count for display
        const totalCount = await ctx.prisma.backlinkOpportunity.count({
          where: { status: 'ACTIVE' },
        });

        return {
          opportunities,
          nextCursor: undefined,
          hasMore: false,
          totalCount,
          planLimit: 50,
          isFreePlan: true,
        };
      }
      
      // Calculate take limit: unlimited for admins/lifetime, otherwise respect plan limits
      const takeLimit = shouldHaveUnlimitedAccess 
        ? input.limit + 1 
        : Math.min(input.limit + 1, subscription.plan.maxOpportunities);

      const opportunities = await ctx.prisma.backlinkOpportunity.findMany({
        where,
        take: takeLimit,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy,
        include: {
          _count: {
            select: { instructions: true },
          },
        },
      });

      // Get total count for display
      const totalCount = await ctx.prisma.backlinkOpportunity.count({
        where: { status: 'ACTIVE' },
      });

      let nextCursor: string | undefined = undefined;
      if (opportunities.length > input.limit) {
        const nextItem = opportunities.pop();
        nextCursor = nextItem!.id;
      }

      return {
        opportunities,
        nextCursor,
        hasMore: !!nextCursor,
        totalCount,
        planLimit: shouldHaveUnlimitedAccess ? 999999 : subscription.plan.maxOpportunities,
        isFreePlan: false,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const opportunity = await ctx.prisma.backlinkOpportunity.findUnique({
        where: { id: input.id },
        include: {
          instructions: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      if (!opportunity) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Opportunity not found' });
      }

      return opportunity;
    }),

  addToProject: protectedProcedure
    .input(
      z.object({
        opportunityId: z.string(),
        projectId: z.string(),
        status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
        priority: z.number().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const existing = await ctx.prisma.projectOpportunity.findUnique({
        where: {
          projectId_opportunityId: {
            projectId: input.projectId,
            opportunityId: input.opportunityId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Opportunity already added to this project',
        });
      }

      const projectOpportunity = await ctx.prisma.projectOpportunity.create({
        data: {
          projectId: input.projectId,
          opportunityId: input.opportunityId,
          status: input.status || 'NOT_STARTED',
          priority: input.priority || 3,
        },
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.user.id,
          projectId: input.projectId,
          opportunityId: input.opportunityId,
          type: 'OPPORTUNITY_ADDED',
          title: 'Added opportunity to project',
        },
      });

      return projectOpportunity;
    }),

  removeFromProject: protectedProcedure
    .input(z.object({ projectOpportunityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const projectOpportunity = await ctx.prisma.projectOpportunity.findUnique({
        where: { id: input.projectOpportunityId },
        include: { project: true },
      });

      if (!projectOpportunity || projectOpportunity.project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await ctx.prisma.projectOpportunity.delete({
        where: { id: input.projectOpportunityId },
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.user.id,
          projectId: projectOpportunity.projectId,
          opportunityId: projectOpportunity.opportunityId,
          type: 'OPPORTUNITY_REMOVED',
          title: 'Removed opportunity from project',
        },
      });

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        projectOpportunityId: z.string(),
        status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED']),
        notes: z.string().optional(),
        linkUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const projectOpportunity = await ctx.prisma.projectOpportunity.findUnique({
        where: { id: input.projectOpportunityId },
        include: { project: true },
      });

      if (!projectOpportunity || projectOpportunity.project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const updated = await ctx.prisma.projectOpportunity.update({
        where: { id: input.projectOpportunityId },
        data: {
          status: input.status,
          ...(input.notes && { notes: input.notes }),
          ...(input.linkUrl && { linkUrl: input.linkUrl }),
          ...(input.status === 'SUBMITTED' && { submittedAt: new Date() }),
          ...(input.status === 'APPROVED' && { approvedAt: new Date() }),
          ...(input.status === 'REJECTED' && { rejectedAt: new Date() }),
        },
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.user.id,
          projectId: projectOpportunity.projectId,
          opportunityId: projectOpportunity.opportunityId,
          projectOpportunityId: input.projectOpportunityId,
          type: 'STATUS_CHANGE',
          title: `Status changed to ${input.status}`,
          description: input.notes,
        },
      });

      return updated;
    }),

  getFilters: protectedProcedure.query(async ({ ctx }) => {
    const [categories, niches, linkTypes, languages, countries] = await Promise.all([
      ctx.prisma.backlinkOpportunity.findMany({
        where: { status: 'ACTIVE' },
        select: { category: true },
        distinct: ['category'],
      }),
      ctx.prisma.backlinkOpportunity.findMany({
        where: { status: 'ACTIVE' },
        select: { niche: true },
        distinct: ['niche'],
      }),
      ctx.prisma.backlinkOpportunity.findMany({
        where: { status: 'ACTIVE' },
        select: { linkType: true },
        distinct: ['linkType'],
      }),
      ctx.prisma.backlinkOpportunity.findMany({
        where: { status: 'ACTIVE' },
        select: { language: true },
        distinct: ['language'],
      }),
      ctx.prisma.backlinkOpportunity.findMany({
        where: { status: 'ACTIVE', country: { not: null } },
        select: { country: true },
        distinct: ['country'],
      }),
    ]);

    return {
      categories: categories.map((c) => c.category),
      niches: niches.map((n) => n.niche),
      linkTypes: linkTypes.map((l) => l.linkType),
      languages: languages.map((l) => l.language),
      countries: countries.map((c) => c.country).filter(Boolean),
    };
  }),
});
