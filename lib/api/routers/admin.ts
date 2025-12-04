import { router, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDomainMetrics } from '../../dataforseo.js';

export const adminRouter = router({
  // List all opportunities (including inactive ones)
  listOpportunities: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
        search: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'NEEDS_REVIEW', 'BROKEN']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        ...(input.search && {
          OR: [
            { siteName: { contains: input.search, mode: 'insensitive' } },
            { shortDescription: { contains: input.search, mode: 'insensitive' } },
            { category: { contains: input.search, mode: 'insensitive' } },
          ],
        }),
        ...(input.status && { status: input.status }),
      };

      const opportunities = await ctx.prisma.backlinkOpportunity.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { instructions: true },
          },
        },
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
      };
    }),

  // Get a single opportunity with all instructions
  getOpportunity: adminProcedure
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

  // Create a new opportunity
  createOpportunity: adminProcedure
    .input(
      z.object({
        url: z.string().url(),
        siteName: z.string().min(1),
        shortDescription: z.string().min(1),
        fullDescription: z.string().optional(),
        category: z.string().min(1),
        niche: z.string().min(1),
        language: z.string().default('en'),
        country: z.string().optional(),
        linkType: z.enum([
          'PROFILE',
          'DIRECTORY',
          'GUEST_POST',
          'FORUM',
          'SOCIAL',
          'ARTICLE_SUBMISSION',
          'BLOG_COMMENT',
          'WEB_2_0',
          'Q_AND_A',
          'BUSINESS_LISTING',
        ]),
        isFree: z.boolean().default(true),
        cost: z.number().optional(),
        difficultyLevel: z.number().min(1).max(5).default(3),
        domainAuthority: z.number().optional(),
        domainRating: z.number().optional(),
        estimatedTraffic: z.number().optional(),
        spamScore: z.number().optional().default(0),
        referringDomains: z.number().optional(),
        totalBacklinks: z.number().optional(),
        trafficValue: z.number().optional(),
        trustFlow: z.number().optional(),
        citationFlow: z.number().optional(),
        isDofollow: z.boolean().default(true),
        status: z.enum(['ACTIVE', 'INACTIVE', 'NEEDS_REVIEW', 'BROKEN']).default('ACTIVE'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const opportunity = await ctx.prisma.backlinkOpportunity.create({
        data: input,
      });

      return opportunity;
    }),

  // Update an existing opportunity
  updateOpportunity: adminProcedure
    .input(
      z.object({
        id: z.string(),
        url: z.string().url().optional(),
        siteName: z.string().min(1).optional(),
        shortDescription: z.string().min(1).optional(),
        fullDescription: z.string().optional(),
        category: z.string().min(1).optional(),
        niche: z.string().min(1).optional(),
        language: z.string().optional(),
        country: z.string().optional(),
        linkType: z.enum([
          'PROFILE',
          'DIRECTORY',
          'GUEST_POST',
          'FORUM',
          'SOCIAL',
          'ARTICLE_SUBMISSION',
          'BLOG_COMMENT',
          'WEB_2_0',
          'Q_AND_A',
          'BUSINESS_LISTING',
        ]).optional(),
        isFree: z.boolean().optional(),
        cost: z.number().optional(),
        difficultyLevel: z.number().min(1).max(5).optional(),
        domainAuthority: z.number().optional(),
        domainRating: z.number().optional(),
        estimatedTraffic: z.number().optional(),
        spamScore: z.number().optional(),
        referringDomains: z.number().optional(),
        totalBacklinks: z.number().optional(),
        trafficValue: z.number().optional(),
        trustFlow: z.number().optional(),
        citationFlow: z.number().optional(),
        isDofollow: z.boolean().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'NEEDS_REVIEW', 'BROKEN']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const opportunity = await ctx.prisma.backlinkOpportunity.update({
        where: { id },
        data,
      });

      return opportunity;
    }),

  // Delete an opportunity
  deleteOpportunity: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.backlinkOpportunity.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Add a new instruction step
  createInstruction: adminProcedure
    .input(
      z.object({
        opportunityId: z.string(),
        stepOrder: z.number().min(1),
        stepTitle: z.string().min(1),
        stepDescription: z.string().min(1),
        screenshotUrl: z.string().url().optional(),
        estimatedMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instruction = await ctx.prisma.opportunityInstruction.create({
        data: input,
      });

      return instruction;
    }),

  // Update an instruction step
  updateInstruction: adminProcedure
    .input(
      z.object({
        id: z.string(),
        stepOrder: z.number().min(1).optional(),
        stepTitle: z.string().min(1).optional(),
        stepDescription: z.string().min(1).optional(),
        screenshotUrl: z.string().url().optional(),
        estimatedMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const instruction = await ctx.prisma.opportunityInstruction.update({
        where: { id },
        data,
      });

      return instruction;
    }),

  // Delete an instruction step
  deleteInstruction: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.opportunityInstruction.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Reorder instructions
  reorderInstructions: adminProcedure
    .input(
      z.object({
        opportunityId: z.string(),
        instructionIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update each instruction with new stepOrder
      const updatePromises = input.instructionIds.map((id, index) =>
        ctx.prisma.opportunityInstruction.update({
          where: { id },
          data: { stepOrder: index + 1 },
        })
      );

      await Promise.all(updatePromises);

      return { success: true };
    }),

  // Get statistics for admin dashboard
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalOpportunities,
      activeOpportunities,
      totalInstructions,
      totalUsers,
      totalProjects,
    ] = await Promise.all([
      ctx.prisma.backlinkOpportunity.count(),
      ctx.prisma.backlinkOpportunity.count({ where: { status: 'ACTIVE' } }),
      ctx.prisma.opportunityInstruction.count(),
      ctx.prisma.user.count(),
      ctx.prisma.project.count(),
    ]);

    return {
      totalOpportunities,
      activeOpportunities,
      totalInstructions,
      totalUsers,
      totalProjects,
    };
  }),

  // User management procedures
  listUsers: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { users };
  }),

  updateUserPlan: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        planId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the plan details
      const plan = await ctx.prisma.plan.findUnique({
        where: { id: input.planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan not found',
        });
      }

      // Check if user already has a subscription
      const existingSubscription = await ctx.prisma.subscription.findUnique({
        where: { userId: input.userId },
      });

      if (existingSubscription) {
        // Update existing subscription
        await ctx.prisma.subscription.update({
          where: { userId: input.userId },
          data: {
            planId: input.planId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'ACTIVE',
          },
        });
      } else {
        // Create new subscription
        await ctx.prisma.subscription.create({
          data: {
            userId: input.userId,
            planId: input.planId,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Create a PaymentTransaction record for paid plans (for statistics tracking)
      if (plan.price > 0) {
        await ctx.prisma.paymentTransaction.create({
          data: {
            userId: input.userId,
            planId: input.planId,
            amount: plan.price / 100, // Convert cents to dollars
            currency: 'usd',
            status: 'SUCCEEDED',
            sessionId: `admin_plan_change_${Date.now()}_${input.userId}`,
            metadata: {
              source: 'admin_update',
              adminId: ctx.session?.user?.id,
              adminEmail: ctx.session?.user?.email,
              planName: plan.name,
              note: 'Plan updated by admin',
            },
          },
        });
      }

      // Update user account status to ACTIVE if it was PENDING
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          accountStatus: 'ACTIVE',
        },
      });

      return { success: true };
    }),

  cancelUserSubscription: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has a subscription
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { userId: input.userId },
        include: { user: true },
      });

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User does not have an active subscription',
        });
      }

      // Update subscription status to CANCELED
      await ctx.prisma.subscription.update({
        where: { userId: input.userId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
          cancelAtPeriodEnd: true,
        },
      });

      return { success: true };
    }),

  restoreUserSubscription: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has a subscription
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { userId: input.userId },
        include: { user: true },
      });

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User does not have a subscription',
        });
      }

      if (subscription.status !== 'CANCELED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Subscription is not canceled',
        });
      }

      // Restore subscription to ACTIVE status
      await ctx.prisma.subscription.update({
        where: { userId: input.userId },
        data: {
          status: 'ACTIVE',
          canceledAt: null,
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      return { success: true };
    }),

  resetUserPassword: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Prevent resetting admin passwords (security measure)
      if (user.role === 'ADMIN' && user.id !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot reset password for other admin users',
        });
      }

      // Hash the new password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // Update user's password
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { password: hashedPassword },
      });

      return { success: true };
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().min(1, 'Name is required').optional(),
        email: z.string().email('Invalid email format').optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, ...updates } = input;

      // Check if user exists
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // If email is being updated, check if it's already in use
      if (updates.email && updates.email !== user.email) {
        const existingUser = await ctx.prisma.user.findUnique({
          where: { email: updates.email },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email is already in use',
          });
        }
      }

      // Update user details
      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: updates,
      });

      return { success: true, user: updatedUser };
    }),

  // Fetch domain metrics from DataForSEO
  fetchDomainMetrics: adminProcedure
    .input(
      z.object({
        url: z.string().min(1, 'URL is required'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const metrics = await getDomainMetrics(input.url);
        return { success: true, metrics };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch domain metrics',
        });
      }
    }),

  // Get recent payment transactions (for statistics)
  getRecentTransactions: adminProcedure.query(async ({ ctx }) => {
    const transactions = await ctx.prisma.paymentTransaction.findMany({
      where: {
        status: 'SUCCEEDED',
      },
      include: {
        user: {
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
            couponUsages: {
              include: {
                coupon: true,
              },
              orderBy: {
                usedAt: 'desc',
              },
              take: 1, // Get most recent coupon usage
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Get last 100 transactions
    });

    // Enrich transactions with coupon information from metadata or usage
    const enrichedTransactions = transactions.map(transaction => {
      // Check if coupon code is in metadata (from Stripe checkout)
      const couponCode = transaction.metadata && 
        typeof transaction.metadata === 'object' && 
        'couponCode' in transaction.metadata 
        ? (transaction.metadata as any).couponCode 
        : null;
      
      // If not in metadata, check recent coupon usage for this user
      const recentCouponUsage = transaction.user?.couponUsages?.[0];
      
      return {
        ...transaction,
        couponCode: couponCode || recentCouponUsage?.coupon?.code || null,
      };
    });

    return { transactions: enrichedTransactions };
  }),
});
