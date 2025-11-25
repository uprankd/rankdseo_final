import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const projectRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const projects = await ctx.prisma.project.findMany({
        where: { userId: ctx.user.id },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { opportunities: true },
          },
          opportunities: {
            select: {
              status: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (projects.length > input.limit) {
        const nextItem = projects.pop();
        nextCursor = nextItem!.id;
      }

      return {
        projects,
        nextCursor,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        include: {
          opportunities: {
            include: {
              opportunity: {
                include: {
                  instructions: {
                    orderBy: { stepOrder: 'asc' },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      return project;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        domain: z.string().optional(),
        niche: z.string().optional(),
        targetCountry: z.string().optional(),
        targetLanguage: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check project limit
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { userId: ctx.user.id },
        include: { plan: true },
      });

      if (!subscription) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No active subscription',
        });
      }

      const projectCount = await ctx.prisma.project.count({
        where: { userId: ctx.user.id },
      });

      if (projectCount >= subscription.plan.maxProjects) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Project limit reached. Upgrade to create more projects.`,
        });
      }

      const project = await ctx.prisma.project.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.user.id,
          projectId: project.id,
          type: 'PROJECT_CREATED',
          title: `Created project: ${project.name}`,
        },
      });

      return project;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        domain: z.string().optional(),
        niche: z.string().optional(),
        targetCountry: z.string().optional(),
        targetLanguage: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existingProject = await ctx.prisma.project.findFirst({
        where: { id, userId: ctx.user.id },
      });

      if (!existingProject) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const project = await ctx.prisma.project.update({
        where: { id },
        data,
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.user.id,
          projectId: project.id,
          type: 'PROJECT_UPDATED',
          title: `Updated project: ${project.name}`,
        },
      });

      return project;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      await ctx.prisma.project.delete({
        where: { id: input.id },
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.user.id,
          type: 'PROJECT_DELETED',
          title: `Deleted project: ${project.name}`,
        },
      });

      return { success: true };
    }),

  getStats: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        include: {
          opportunities: {
            select: { status: true },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const statusCounts = project.opportunities.reduce(
        (acc, opp) => {
          acc[opp.status] = (acc[opp.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        total: project.opportunities.length,
        byStatus: statusCounts,
      };
    }),
});
