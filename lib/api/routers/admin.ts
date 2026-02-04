import { router, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDomainMetrics } from '../../dataforseo.js';
import { sendEmail, emailTemplates } from '../../mailgun';

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
        sendNotification: z.boolean().default(true), // Option to send email notifications
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sendNotification, ...opportunityData } = input;
      
      const opportunity = await ctx.prisma.backlinkOpportunity.create({
        data: opportunityData,
      });

      // Send email notifications to all active users (async, non-blocking)
      if (sendNotification && opportunity.status === 'ACTIVE') {
        // Run notification in background to not block the response
        notifyUsersOfNewOpportunity(ctx.prisma, opportunity).catch((error) => {
          console.error('❌ Failed to send new opportunity notifications:', error);
        });
      }

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

      // Send cancellation email
      try {
        const endDate = subscription.currentPeriodEnd 
          ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
          : 'immediately';
        const cancelEmail = emailTemplates.subscriptionCancelled(
          subscription.user.name || 'User',
          endDate
        );
        await sendEmail({
          to: subscription.user.email,
          subject: cancelEmail.subject,
          html: cancelEmail.html,
          metadata: {
            userId: subscription.user.id,
            emailType: 'subscription_cancelled',
            canceledBy: ctx.session.user.id,
          },
        });
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }

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
      const updatedSubscription = await ctx.prisma.subscription.update({
        where: { userId: input.userId },
        data: {
          status: 'ACTIVE',
          canceledAt: null,
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        include: {
          plan: true,
        },
      });

      // Send reactivation email
      try {
        const planFeatures = [
          `${updatedSubscription.plan.maxOpportunities} backlink opportunities`,
          `${updatedSubscription.plan.maxProjects} projects`,
          'Priority support',
          'Step-by-step tutorials',
        ];
        const activationEmail = emailTemplates.subscriptionActivated(
          subscription.user.name || 'User',
          updatedSubscription.plan.name,
          planFeatures
        );
        await sendEmail({
          to: subscription.user.email,
          subject: activationEmail.subject,
          html: activationEmail.html,
          metadata: {
            userId: subscription.user.id,
            emailType: 'subscription_activated',
            restoredBy: ctx.session.user.id,
          },
        });
      } catch (emailError) {
        console.error('Failed to send reactivation email:', emailError);
      }

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

      // Send password reset email
      try {
        const passwordEmail = emailTemplates.passwordReset(
          user.name || 'User',
          input.newPassword,
          ctx.session.user.name || 'Admin'
        );
        await sendEmail({
          to: user.email,
          subject: passwordEmail.subject,
          html: passwordEmail.html,
          metadata: {
            userId: user.id,
            emailType: 'password_reset',
            resetByAdmin: ctx.session.user.id,
          },
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the password reset if email fails
      }

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

  deleteUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
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

      // Prevent deleting admin users
      if (user.role === 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete admin users',
        });
      }

      // Prevent admin from deleting themselves
      if (user.id === ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot delete your own account',
        });
      }

      // Delete user (this will cascade delete related records due to Prisma schema)
      // The following will be automatically deleted:
      // - Subscription
      // - Projects (and their opportunities)
      // - Payment transactions
      // - Coupon usages
      // - User preferences
      await ctx.prisma.user.delete({
        where: { id: input.userId },
      });

      console.log(`🗑️ Admin ${ctx.session.user.email} deleted user ${user.email} (${user.id})`);

      return { success: true };
    }),

  // List all invoices/payment transactions
  listInvoices: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
        search: z.string().optional(), // Search by email or invoice number
        status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED']).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        ...(input.status && { status: input.status }),
        ...(input.userId && { userId: input.userId }),
        ...(input.dateFrom && {
          createdAt: {
            gte: new Date(input.dateFrom),
          },
        }),
        ...(input.dateTo && {
          createdAt: {
            ...((where as any)?.createdAt || {}),
            lte: new Date(input.dateTo),
          },
        }),
      };

      // If searching, add search conditions
      if (input.search) {
        where.OR = [
          { id: { contains: input.search, mode: 'insensitive' } },
          { sessionId: { contains: input.search, mode: 'insensitive' } },
          { paymentIntent: { contains: input.search, mode: 'insensitive' } },
          { user: { email: { contains: input.search, mode: 'insensitive' } } },
          { user: { name: { contains: input.search, mode: 'insensitive' } } },
        ];
      }

      const transactions = await ctx.prisma.paymentTransaction.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      // Fetch plans for each transaction
      const planIds = [...new Set(transactions.map(t => t.planId).filter(Boolean))];
      const plans = planIds.length > 0 
        ? await ctx.prisma.plan.findMany({
            where: { id: { in: planIds as string[] } },
            select: { id: true, name: true, price: true },
          })
        : [];
      const planMap = new Map(plans.map(p => [p.id, p]));

      // Add plan data to transactions
      const transactionsWithPlans = transactions.map(t => ({
        ...t,
        plan: t.planId ? planMap.get(t.planId) || null : null,
      }));

      let nextCursor: string | undefined = undefined;
      if (transactionsWithPlans.length > input.limit) {
        const nextItem = transactionsWithPlans.pop();
        nextCursor = nextItem!.id;
      }

      // Get total count and stats
      const [totalCount, totalRevenue, statusCounts] = await Promise.all([
        ctx.prisma.paymentTransaction.count({ where: input.search ? where : {} }),
        ctx.prisma.paymentTransaction.aggregate({
          where: { status: 'SUCCEEDED' },
          _sum: { amount: true },
        }),
        ctx.prisma.paymentTransaction.groupBy({
          by: ['status'],
          _count: true,
        }),
      ]);

      return {
        transactions: transactionsWithPlans,
        nextCursor,
        totalCount,
        totalRevenue: totalRevenue._sum.amount || 0,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      };
    }),

  // Get single invoice details
  getInvoice: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.paymentTransaction.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
          plan: true,
        },
      });

      if (!transaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      return transaction;
    }),

  // Resend invoice email
  resendInvoice: adminProcedure
    .input(z.object({ transactionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.paymentTransaction.findUnique({
        where: { id: input.transactionId },
        include: {
          user: true,
          plan: true,
        },
      });

      if (!transaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        });
      }

      if (!transaction.user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No user associated with this transaction',
        });
      }

      const isLifetime = transaction.plan?.name.toLowerCase().includes('lifetime');
      const invoiceNumber = `INV-${new Date(transaction.createdAt).getFullYear()}-${transaction.id.slice(-6).toUpperCase()}`;

      const receiptEmail = emailTemplates.paymentReceipt(
        transaction.user.name || 'User',
        {
          invoiceNumber,
          transactionId: transaction.paymentIntent || transaction.sessionId || transaction.id,
          date: new Date(transaction.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          planName: transaction.plan?.name || 'Subscription',
          planDescription: isLifetime
            ? 'One-time payment - Lifetime access'
            : 'Subscription payment',
          amount: transaction.amount,
          currency: transaction.currency,
          paymentMethod: 'stripe',
          billingEmail: transaction.user.email,
          billingName: transaction.user.name || 'Customer',
          isLifetime,
        }
      );

      await sendEmail({
        to: transaction.user.email,
        subject: receiptEmail.subject,
        html: receiptEmail.html,
        metadata: {
          userId: transaction.user.id,
          emailType: 'payment_receipt_resend',
          transactionId: transaction.id,
          resentBy: ctx.session.user.email,
        },
      });

      console.log(`📧 Invoice resent to ${transaction.user.email} by ${ctx.session.user.email}`);

      return { success: true, email: transaction.user.email };
    }),

  // Get invoice stats
  getInvoiceStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      thisYearRevenue,
      totalTransactions,
      successfulTransactions,
      recentTransactions,
    ] = await Promise.all([
      ctx.prisma.paymentTransaction.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
      ctx.prisma.paymentTransaction.aggregate({
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: thisMonth },
        },
        _sum: { amount: true },
      }),
      ctx.prisma.paymentTransaction.aggregate({
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
        _sum: { amount: true },
      }),
      ctx.prisma.paymentTransaction.aggregate({
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: thisYear },
        },
        _sum: { amount: true },
      }),
      ctx.prisma.paymentTransaction.count(),
      ctx.prisma.paymentTransaction.count({ where: { status: 'SUCCEEDED' } }),
      ctx.prisma.paymentTransaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, name: true } },
          plan: { select: { name: true } },
        },
      }),
    ]);

    const monthlyGrowth =
      lastMonthRevenue._sum.amount && lastMonthRevenue._sum.amount > 0
        ? ((thisMonthRevenue._sum.amount || 0) - lastMonthRevenue._sum.amount) /
          lastMonthRevenue._sum.amount *
          100
        : 0;

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
      lastMonthRevenue: lastMonthRevenue._sum.amount || 0,
      thisYearRevenue: thisYearRevenue._sum.amount || 0,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      totalTransactions,
      successfulTransactions,
      successRate: totalTransactions > 0 
        ? Math.round((successfulTransactions / totalTransactions) * 100) 
        : 0,
      recentTransactions,
    };
  }),
});

// Helper function to notify all users of a new opportunity
async function notifyUsersOfNewOpportunity(
  prisma: any,
  opportunity: {
    id: string;
    siteName: string;
    shortDescription: string;
    category: string;
    linkType: string;
    domainAuthority: number | null;
    isFree: boolean;
  }
) {
  console.log(`📧 Starting notification for new opportunity: ${opportunity.siteName}`);
  
  try {
    // Get all active users with active subscriptions
    const users = await prisma.user.findMany({
      where: {
        accountStatus: 'ACTIVE',
        subscription: {
          status: 'ACTIVE',
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`📧 Found ${users.length} active users to notify`);

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 10;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (user: { id: string; email: string; name: string | null }) => {
          try {
            const emailContent = emailTemplates.newOpportunity(
              user.name || 'there',
              {
                siteName: opportunity.siteName,
                shortDescription: opportunity.shortDescription,
                category: opportunity.category,
                linkType: opportunity.linkType,
                domainAuthority: opportunity.domainAuthority || undefined,
                isFree: opportunity.isFree,
                id: opportunity.id,
              }
            );

            await sendEmail({
              to: user.email,
              subject: emailContent.subject,
              html: emailContent.html,
              metadata: {
                userId: user.id,
                emailType: 'new_opportunity',
                opportunityId: opportunity.id,
              },
            });

            successCount++;
          } catch (error) {
            failCount++;
            console.error(`❌ Failed to send notification to ${user.email}:`, error);
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`📧 Notification complete: ${successCount} sent, ${failCount} failed`);
  } catch (error) {
    console.error('❌ Error in notifyUsersOfNewOpportunity:', error);
    throw error;
  }
}
