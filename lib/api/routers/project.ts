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

  addOpportunity: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        opportunityId: z.string(),
        priority: z.number().min(1).max(5).optional().default(3),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Check if opportunity already exists in project
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
          message: 'This opportunity is already in the project',
        });
      }

      const projectOpportunity = await ctx.prisma.projectOpportunity.create({
        data: {
          projectId: input.projectId,
          opportunityId: input.opportunityId,
          priority: input.priority,
          notes: input.notes,
        },
        include: {
          opportunity: true,
        },
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.user.id,
          projectId: input.projectId,
          type: 'OPPORTUNITY_ADDED',
          title: `Added opportunity: ${projectOpportunity.opportunity.siteName}`,
        },
      });

      return projectOpportunity;
    }),

  removeOpportunity: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        opportunityId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const projectOpportunity = await ctx.prisma.projectOpportunity.findUnique({
        where: {
          projectId_opportunityId: {
            projectId: input.projectId,
            opportunityId: input.opportunityId,
          },
        },
        include: {
          opportunity: true,
        },
      });

      if (!projectOpportunity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Opportunity not found in project',
        });
      }

      await ctx.prisma.projectOpportunity.delete({
        where: {
          projectId_opportunityId: {
            projectId: input.projectId,
            opportunityId: input.opportunityId,
          },
        },
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.user.id,
          projectId: input.projectId,
          type: 'OPPORTUNITY_REMOVED',
          title: `Removed opportunity: ${projectOpportunity.opportunity.siteName}`,
        },
      });

      return { success: true };
    }),

  updateOpportunityStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        opportunityId: z.string(),
        status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED']),
        notes: z.string().optional(),
        linkUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      let finalStatus = input.status;
      const updateData: any = {
        status: input.status,
      };

      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.linkUrl !== undefined) updateData.linkUrl = input.linkUrl;

      // Auto-verify link when status is SUBMITTED
      if (input.status === 'SUBMITTED' && input.linkUrl) {
        try {
          // Check if the link is live
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(input.linkUrl, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
          });

          clearTimeout(timeoutId);

          // If link is accessible (200-399 status codes), auto-approve
          if (response.ok || (response.status >= 300 && response.status < 400)) {
            finalStatus = 'APPROVED';
            updateData.status = 'APPROVED';
            updateData.approvedAt = new Date();
            console.log(`✅ Auto-approved: ${input.linkUrl} - Status ${response.status}`);
          } else {
            // Link exists but may have issues
            updateData.submittedAt = new Date();
            console.log(`⚠️ Link submitted but returned ${response.status}: ${input.linkUrl}`);
          }
        } catch (error: any) {
          // Link verification failed - keep as SUBMITTED
          updateData.submittedAt = new Date();
          console.log(`❌ Link verification failed: ${input.linkUrl} - ${error.message}`);
        }
      } else {
        // Set timestamps based on status (for non-SUBMITTED or no URL)
        if (input.status === 'SUBMITTED') {
          updateData.submittedAt = new Date();
        } else if (input.status === 'APPROVED') {
          updateData.approvedAt = new Date();
        } else if (input.status === 'REJECTED') {
          updateData.rejectedAt = new Date();
        }
      }

      const projectOpportunity = await ctx.prisma.projectOpportunity.update({
        where: {
          projectId_opportunityId: {
            projectId: input.projectId,
            opportunityId: input.opportunityId,
          },
        },
        data: updateData,
        include: {
          opportunity: true,
        },
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.user.id,
          projectId: input.projectId,
          type: 'STATUS_CHANGE',
          title: `${projectOpportunity.opportunity.siteName} status: ${finalStatus}${
            finalStatus === 'APPROVED' && input.status === 'SUBMITTED' ? ' (auto-verified)' : ''
          }`,
        },
      });

      return projectOpportunity;
    }),
});
