import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail, emailTemplates } from '@/lib/mailgun';

export const settingsRouter = router({
  // Profile Management
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email } = input;
      const userId = ctx.session.user.id;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await ctx.prisma.user.findUnique({
          where: { email },
        });
        if (existingUser && existingUser.id !== userId) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email is already in use',
          });
        }
      }

      const user = await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword } = input;
      const userId = ctx.session.user.id;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await ctx.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { success: true };
    }),

  // Preferences Management
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    let preferences = await ctx.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await ctx.prisma.userPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        notifyNewOpportunities: z.boolean().optional(),
        notifyLinkVerification: z.boolean().optional(),
        notifySubscriptionChanges: z.boolean().optional(),
        defaultOpportunityFilter: z.any().optional(),
        dashboardLayout: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const preferences = await ctx.prisma.userPreferences.upsert({
        where: { userId },
        update: input,
        create: {
          userId,
          ...input,
        },
      });

      return { success: true, preferences };
    }),

  // API Key Management
  listApiKeys: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const apiKeys = await ctx.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys;
  }),

  generateApiKey: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user has API access
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { userId },
        include: { plan: true },
      });

      if (!subscription?.plan.allowApiAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Your subscription plan does not include API access',
        });
      }

      // Generate a random API key
      const key = 'rk_' + crypto.randomBytes(32).toString('hex');

      const apiKey = await ctx.prisma.apiKey.create({
        data: {
          userId,
          name: input.name,
          key,
        },
      });

      return apiKey;
    }),

  deleteApiKey: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const apiKey = await ctx.prisma.apiKey.findUnique({
        where: { id: input.id },
      });

      if (!apiKey || apiKey.userId !== userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        });
      }

      await ctx.prisma.apiKey.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Account Management
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: {
          include: {
            opportunities: {
              include: {
                opportunity: true,
              },
            },
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
        preferences: true,
        activityLogs: true,
      },
    });

    return user;
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get user info before deletion for the email
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const userEmail = user.email;
    const userName = user.name || 'User';
    const deletionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Delete user and all related data (cascade)
    await ctx.prisma.user.delete({
      where: { id: userId },
    });

    // Send account deletion confirmation email
    try {
      const emailContent = emailTemplates.accountDeleted(userName, userEmail, deletionDate);
      await sendEmail({
        to: userEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        metadata: {
          emailType: 'account_deleted',
          deletedUserId: userId,
        },
      });
      console.log(`📧 Account deletion confirmation sent to ${userEmail}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send account deletion email:', emailError);
      // Don't throw - account is already deleted, email is just a notification
    }

    return { success: true };
  }),
});
