import { router, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDomainMetrics } from '../../dataforseo.js';
import { sendEmail, emailTemplates } from '../../mailgun';
import { createBackup, listBackups, restoreBackup, deleteBackup } from '../../jobs/backup';
import type { BackupInfo } from '../../jobs/backup';
import { stripe } from '../../stripe';

function generateSlug(siteName: string): string {
  return siteName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    + '-backlink';
}

async function getUniqueSlug(prisma: any, siteName: string, excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(siteName);
  let slug = baseSlug;
  let counter = 2;
  
  while (true) {
    const existing = await prisma.backlinkOpportunity.findUnique({ where: { slug } });
    if (!existing || (excludeId && existing.id === excludeId)) break;
    slug = baseSlug.replace('-backlink', '') + '-' + counter + '-backlink';
    counter++;
  }
  return slug;
}

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
      
      // Auto-generate slug from siteName
      const slug = await getUniqueSlug(ctx.prisma, opportunityData.siteName);
      
      const opportunity = await ctx.prisma.backlinkOpportunity.create({
        data: { ...opportunityData, slug } as any,
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

      // Regenerate slug if siteName changed
      if (data.siteName) {
        (data as any).slug = await getUniqueSlug(ctx.prisma, data.siteName, id);
      }

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
        screenshotUrl: z.string().optional(),
        estimatedMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instruction = await ctx.prisma.opportunityInstruction.create({
        data: input as any,
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
        screenshotUrl: z.string().optional(),
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
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get most recent payment
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
      // Get the user
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Get the new plan details
      const newPlan = await ctx.prisma.plan.findUnique({
        where: { id: input.planId },
      });

      if (!newPlan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan not found',
        });
      }

      console.log(`🔄 Admin updating plan for ${user.email}: ${user.subscription?.plan.name || 'No Plan'} → ${newPlan.name}`);

      const existingSubscription = user.subscription;

      // Calculate period end based on plan interval
      let periodEnd: Date;
      if (newPlan.interval === 'year' || newPlan.interval === 'lifetime') {
        periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      } else {
        periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }

      // Handle Stripe subscription update if user has active Stripe subscription
      if (existingSubscription?.stripeSubscriptionId) {
        try {
          console.log(`🔄 Canceling old Stripe subscription: ${existingSubscription.stripeSubscriptionId}`);
          
          // Cancel the old Stripe subscription immediately
          await stripe.subscriptions.cancel(existingSubscription.stripeSubscriptionId);
          
          console.log(`✅ Old Stripe subscription canceled`);
          
          // If the new plan is paid and has a Stripe price ID, create a new Stripe subscription
          if (newPlan.price > 0 && newPlan.stripePriceId && existingSubscription.stripeCustomerId) {
            console.log(`🔄 Creating new Stripe subscription for ${newPlan.name}`);
            
            const newStripeSubscription = await stripe.subscriptions.create({
              customer: existingSubscription.stripeCustomerId,
              items: [{ price: newPlan.stripePriceId }],
              metadata: {
                userId: user.id,
                userEmail: user.email,
                planId: newPlan.id,
                planName: newPlan.name,
                source: 'admin_plan_change',
                adminId: ctx.session?.user?.id || 'unknown',
              },
            });

            console.log(`✅ New Stripe subscription created: ${newStripeSubscription.id}`);

            // Update subscription with new Stripe subscription ID
            await ctx.prisma.subscription.update({
              where: { userId: input.userId },
              data: {
                planId: input.planId,
                stripeSubscriptionId: newStripeSubscription.id,
                currentPeriodStart: new Date(newStripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(newStripeSubscription.current_period_end * 1000),
                status: 'ACTIVE',
                cancelAtPeriodEnd: false,
                canceledAt: null,
              },
            });
          } else {
            // New plan is free or doesn't have Stripe price - just update database
            await ctx.prisma.subscription.update({
              where: { userId: input.userId },
              data: {
                planId: input.planId,
                stripeSubscriptionId: null, // Remove Stripe subscription ID
                currentPeriodStart: new Date(),
                currentPeriodEnd: periodEnd,
                status: 'ACTIVE',
                cancelAtPeriodEnd: false,
                canceledAt: null,
              },
            });
          }
        } catch (error: any) {
          console.error('❌ Stripe subscription update error:', error);
          
          // If Stripe fails, still update the database (admin override)
          console.log('⚠️ Stripe update failed, proceeding with database update only');
          
          await ctx.prisma.subscription.update({
            where: { userId: input.userId },
            data: {
              planId: input.planId,
              currentPeriodStart: new Date(),
              currentPeriodEnd: periodEnd,
              status: 'ACTIVE',
              cancelAtPeriodEnd: false,
              canceledAt: null,
              // Keep stripeSubscriptionId for reference but it's now invalid
            },
          });
        }
      } else if (existingSubscription) {
        // No Stripe subscription - just update database
        console.log(`📝 Updating subscription in database only (no Stripe)`);
        
        await ctx.prisma.subscription.update({
          where: { userId: input.userId },
          data: {
            planId: input.planId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
            status: 'ACTIVE',
            cancelAtPeriodEnd: false,
            canceledAt: null,
          },
        });
      } else {
        // Create new subscription
        console.log(`📝 Creating new subscription`);
        
        await ctx.prisma.subscription.create({
          data: {
            userId: input.userId,
            planId: input.planId,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
        });
      }

      // Create a PaymentTransaction record for paid plans (for statistics tracking)
      if (newPlan.price > 0) {
        await ctx.prisma.paymentTransaction.create({
          data: {
            userId: input.userId,
            planId: input.planId,
            amount: newPlan.price / 100, // Convert cents to dollars
            currency: 'usd',
            status: 'SUCCEEDED',
            sessionId: `admin_plan_change_${Date.now()}_${input.userId}`,
            paymentMethod: 'stripe', // Default to stripe for admin changes
            metadata: {
              source: 'admin_update',
              adminId: ctx.session?.user?.id,
              adminEmail: ctx.session?.user?.email,
              planName: newPlan.name,
              oldPlanName: existingSubscription?.plan.name,
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

      console.log(`✅ Plan update complete for ${user.email}`);

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

  // Send password reset email link (individual)
  sendPasswordResetEmail: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({ where: { id: input.userId } });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');

      // Invalidate any existing tokens for this user
      await ctx.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Create new token (expires in 24h)
      await ctx.prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      const email = emailTemplates.passwordResetLink(user.name || 'User', resetUrl);
      await sendEmail({
        to: user.email,
        subject: email.subject,
        html: email.html,
        metadata: { userId: user.id, emailType: 'password_reset_link' },
      });

      return { success: true, email: user.email };
    }),

  // Send password reset emails in bulk
  sendBulkPasswordResetEmails: adminProcedure
    .input(z.object({ userIds: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: { id: { in: input.userIds }, accountStatus: 'ACTIVE' },
        select: { id: true, email: true, name: true },
      });

      const crypto = require('crypto');
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          const token = crypto.randomBytes(32).toString('hex');

          await ctx.prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
          });

          await ctx.prisma.passwordResetToken.create({
            data: {
              token,
              userId: user.id,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });

          const resetUrl = `${baseUrl}/reset-password?token=${token}`;
          const email = emailTemplates.passwordResetLink(user.name || 'User', resetUrl);
          await sendEmail({
            to: user.email,
            subject: email.subject,
            html: email.html,
            metadata: { userId: user.id, emailType: 'password_reset_link_bulk' },
          });
          sent++;
        } catch (err) {
          console.error(`Failed to send reset email to ${user.email}:`, err);
          failed++;
        }
      }

      return { sent, failed, total: users.length };
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
      // Build date filter  
      const dateFilter: any = {
        ...(input.dateFrom && { gte: new Date(input.dateFrom) }),
        ...(input.dateTo && { lte: new Date(input.dateTo) }),
      };

      const where: any = {
        ...(input.status && { status: input.status }),
        ...(input.userId && { userId: input.userId }),
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
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
      const planIds = Array.from(new Set(transactions.map(t => t.planId).filter(Boolean)));
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
        },
      });

      if (!transaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      // Fetch plan if planId exists
      let plan = null;
      if (transaction.planId) {
        plan = await ctx.prisma.plan.findUnique({
          where: { id: transaction.planId },
        });
      }

      return { ...transaction, plan };
    }),

  // Resend invoice email
  resendInvoice: adminProcedure
    .input(z.object({ transactionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.paymentTransaction.findUnique({
        where: { id: input.transactionId },
        include: {
          user: true,
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

      // Fetch plan if planId exists
      let plan = null;
      if (transaction.planId) {
        plan = await ctx.prisma.plan.findUnique({
          where: { id: transaction.planId },
        });
      }

      const isLifetime = plan?.name?.toLowerCase().includes('lifetime') || false;
      const invoiceNumber = `INV-${new Date(transaction.createdAt).getFullYear()}-${transaction.id.slice(-6).toUpperCase()}`;

      const receiptEmail = emailTemplates.paymentReceipt(
        transaction.user.name || 'User',
        {
          invoiceNumber,
          transactionId: transaction.paymentIntent || transaction.sessionId || transaction.id,
          transactionDbId: transaction.id,
          date: new Date(transaction.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          planName: plan?.name || 'Subscription',
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
      recentTransactionsRaw,
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
        },
      }),
    ]);

    // Fetch plans for recent transactions
    const planIds = Array.from(new Set(recentTransactionsRaw.map(t => t.planId).filter(Boolean)));
    const plans = planIds.length > 0
      ? await ctx.prisma.plan.findMany({
          where: { id: { in: planIds as string[] } },
          select: { id: true, name: true },
        })
      : [];
    const planMap = new Map(plans.map(p => [p.id, p]));
    
    const recentTransactions = recentTransactionsRaw.map(t => ({
      ...t,
      plan: t.planId ? planMap.get(t.planId) || null : null,
    }));

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

  // ============ UPDATE LOG (Activity Log) ============

  listUpdateLogs: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
      direction: z.enum(['forward', 'backward']).optional(),
      status: z.enum(['PUBLISHED', 'DRAFT', 'ALL']).default('ALL'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const status = input?.status ?? 'ALL';
      
      const where = status === 'ALL' ? {} : { status };
      
      const logs = await ctx.prisma.updateLog.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      const hasMore = logs.length > limit;
      if (hasMore) logs.pop();

      return {
        logs,
        nextCursor: hasMore ? logs[logs.length - 1]?.id : undefined,
        hasMore,
      };
    }),

  createUpdateLog: adminProcedure
    .input(z.object({
      date: z.string(),
      description: z.string().min(1),
      status: z.enum(['PUBLISHED', 'DRAFT']).default('PUBLISHED'),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.updateLog.create({
        data: {
          date: new Date(input.date),
          description: input.description,
          status: input.status,
        },
      });
    }),

  updateUpdateLog: adminProcedure
    .input(z.object({
      id: z.string(),
      date: z.string().optional(),
      description: z.string().min(1).optional(),
      status: z.enum(['PUBLISHED', 'DRAFT']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.updateLog.update({
        where: { id },
        data: {
          ...(data.date ? { date: new Date(data.date) } : {}),
          ...(data.description ? { description: data.description } : {}),
          ...(data.status ? { status: data.status } : {}),
        },
      });
    }),

  deleteUpdateLog: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.updateLog.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ============ OPPORTUNITY REPORTS ============

  listReports: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
      direction: z.enum(['forward', 'backward']).optional(),
      status: z.enum(['PENDING', 'RESOLVED', 'DISMISSED', 'ALL']).default('ALL'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const status = input?.status ?? 'ALL';
      const where = status === 'ALL' ? {} : { status };

      const reports = await ctx.prisma.opportunityReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          opportunity: { select: { id: true, siteName: true, url: true, slug: true, status: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      const hasMore = reports.length > limit;
      if (hasMore) reports.pop();

      const counts = await ctx.prisma.opportunityReport.groupBy({
        by: ['status'],
        _count: true,
      });
      const statusCounts = { PENDING: 0, RESOLVED: 0, DISMISSED: 0 };
      counts.forEach((c: any) => { statusCounts[c.status as keyof typeof statusCounts] = c._count; });

      return { reports, hasMore, nextCursor: hasMore ? reports[reports.length - 1]?.id : undefined, statusCounts };
    }),

  resolveReport: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['RESOLVED', 'DISMISSED']),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.opportunityReport.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  bulkResolveReports: adminProcedure
    .input(z.object({
      ids: z.array(z.string()).min(1),
      status: z.enum(['RESOLVED', 'DISMISSED']),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.opportunityReport.updateMany({
        where: { id: { in: input.ids } },
        data: { status: input.status },
      });
      return { updated: input.ids.length };
    }),

  // Send expiration notification emails to users with expired subscriptions
  sendExpirationEmails: adminProcedure
    .input(z.object({
      userIds: z.array(z.string()).optional(), // specific users, or all expired if omitted
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const now = new Date();

      // Find expired subscriptions (non-admin, non-free, non-demo)
      const expiredSubs = await ctx.prisma.subscription.findMany({
        where: {
          currentPeriodEnd: { lt: now },
          status: 'ACTIVE',
          user: {
            role: 'USER',
            email: { not: 'demo@rankdseo.com' },
          },
          plan: { price: { gt: 0 } },
          ...(input?.userIds && input.userIds.length > 0 ? { userId: { in: input.userIds } } : {}),
        },
        include: {
          user: true,
          plan: true,
        },
      });

      if (expiredSubs.length === 0) {
        return { sent: 0, failed: 0, message: 'No expired subscriptions found' };
      }

      let sent = 0;
      let failed = 0;

      for (const sub of expiredSubs) {
        try {
          const expiredDate = sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'N/A';

          const template = emailTemplates.subscriptionExpired(
            sub.user.name || sub.user.email,
            sub.plan.name,
            expiredDate,
          );

          await sendEmail({
            to: sub.user.email,
            subject: template.subject,
            html: template.html,
          });

          // Mark as sent so automated scheduler skips this user
          await ctx.prisma.subscription.update({
            where: { id: sub.id },
            data: { expirationEmailSentAt: new Date() },
          });

          console.log(`📧 Expiration email sent to ${sub.user.email}`);
          sent++;
        } catch (error) {
          console.error(`❌ Failed to send expiration email to ${sub.user.email}:`, error);
          failed++;
        }
      }

      return { sent, failed, total: expiredSubs.length };
    }),

  // ====== BACKUP SYSTEM ======

  listBackups: adminProcedure.query(async () => {
    return listBackups();
  }),

  createBackup: adminProcedure.mutation(async () => {
    const result = await createBackup();
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error || 'Backup failed' });
    }
    return result;
  }),

  restoreBackup: adminProcedure
    .input(z.object({ backupId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await restoreBackup(input.backupId);
      if (!result.success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.message });
      }
      return result;
    }),

  deleteBackup: adminProcedure
    .input(z.object({ backupId: z.string() }))
    .mutation(async ({ input }) => {
      const deleted = deleteBackup(input.backupId);
      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Backup not found' });
      }
      return { success: true };
    }),

  // Get unpaid users (registered but not on paid plan)
  getUnpaidUsers: adminProcedure
    .input(z.object({
      dateRange: z.enum(['1_month', '3_months', '6_months', '1_year', 'all']).default('all'),
      limit: z.number().min(1).max(500).optional().default(100),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let dateThreshold: Date | undefined;

      // Calculate date threshold based on range
      switch (input.dateRange) {
        case '1_month':
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3_months':
          dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6_months':
          dateThreshold = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1_year':
          dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          dateThreshold = undefined;
          break;
      }

      const where: any = {
        subscription: {
          plan: {
            price: 0, // Free plan users
          }
        },
        ...(dateThreshold && {
          createdAt: {
            gte: dateThreshold,
          }
        })
      };

      const users = await ctx.prisma.user.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor && {
          skip: 1,
          cursor: { id: input.cursor },
        }),
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          subscription: {
            include: {
              plan: true,
            }
          }
        }
      });

      let nextCursor: string | undefined = undefined;
      if (users.length > input.limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }

      // Calculate days since registration for each user
      const usersWithDays = users.map(user => ({
        ...user,
        daysSinceRegistration: Math.floor((now.getTime() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      }));

      return {
        users: usersWithDays,
        nextCursor,
      };
    }),

  // Send email to selected unpaid users
  sendUnpaidUserEmail: adminProcedure
    .input(z.object({
      userIds: z.array(z.string()).min(1),
      customMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          id: {
            in: input.userIds,
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        }
      });

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const user of users) {
        try {
          const emailContent = emailTemplates.bulkUnpaidUserEmail(
            user.name || user.email,
            input.customMessage
          );

          await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
            metadata: {
              userId: user.id,
              emailType: 'unpaid_user_reminder',
            },
          });

          successCount++;
        } catch (error: any) {
          failCount++;
          errors.push(`${user.email}: ${error.message}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: true,
        sent: successCount,
        failed: failCount,
        errors,
      };
    }),

  // Get unpaid users statistics
  getUnpaidUsersStats: adminProcedure
    .query(async ({ ctx }) => {
      const now = new Date();
      
      const baseWhere = {
        subscription: {
          plan: {
            price: 0,
          }
        }
      };

      const total = await ctx.prisma.user.count({ where: baseWhere });

      const lastMonth = await ctx.prisma.user.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          }
        }
      });

      const last3Months = await ctx.prisma.user.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          }
        }
      });

      const last6Months = await ctx.prisma.user.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
          }
        }
      });

      const lastYear = await ctx.prisma.user.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          }
        }
      });

      return {
        total,
        lastMonth,
        last3Months,
        last6Months,
        lastYear,
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
