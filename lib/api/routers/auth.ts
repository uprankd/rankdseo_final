import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { sendEmail, emailTemplates } from '../../mailgun';

export const authRouter = router({
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        planId: z.string().optional(),
        paymentSessionId: z.string().optional(), // Added for Stripe session tracking
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, password, name, planId, paymentSessionId } = input;

      // Check if user exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const hashedPassword = await hash(password, 10);

      // Get selected plan or default to free
      let selectedPlan;
      if (planId) {
        selectedPlan = await ctx.prisma.plan.findUnique({
          where: { id: planId },
        });
      }
      
      if (!selectedPlan) {
        selectedPlan = await ctx.prisma.plan.findUnique({
          where: { name: 'Free' },
        });
      }

      if (!selectedPlan) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Plan not found',
        });
      }

      // Determine account status based on plan price
      const accountStatus = selectedPlan.price === 0 ? 'ACTIVE' : 'PENDING';
      const subscriptionStatus = selectedPlan.price === 0 ? 'ACTIVE' : 'INCOMPLETE';

      // Create user with subscription
      const user = await ctx.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          emailVerified: new Date(), // Auto-verify for MVP
          accountStatus,
          subscription: {
            create: {
              planId: selectedPlan.id,
              status: subscriptionStatus,
              currentPeriodStart: selectedPlan.price === 0 ? new Date() : null,
              currentPeriodEnd: selectedPlan.price === 0 
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                : null,
            },
          },
        },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      });

      // If payment session provided, update existing payment transaction or create new one
      if (paymentSessionId && selectedPlan.price > 0) {
        // First try to find existing transaction with this session ID
        const existingTransaction = await ctx.prisma.paymentTransaction.findUnique({
          where: { sessionId: paymentSessionId },
        });

        if (existingTransaction) {
          // Update existing transaction with user ID
          await ctx.prisma.paymentTransaction.update({
            where: { sessionId: paymentSessionId },
            data: { userId: user.id },
          });
        } else {
          // Create new transaction
          await ctx.prisma.paymentTransaction.create({
            data: {
              userId: user.id,
              planId: selectedPlan.id,
              amount: selectedPlan.price / 100, // Convert cents to dollars
              currency: 'usd',
              status: 'PENDING',
              sessionId: paymentSessionId,
              metadata: {
                planName: selectedPlan.name,
                customerName: name,
              },
            },
          });
        }
      }

      // Send welcome email (async, don't block registration)
      try {
        const welcomeEmail = emailTemplates.welcome(name, email);
        await sendEmail({
          to: email,
          subject: welcomeEmail.subject,
          html: welcomeEmail.html,
          metadata: {
            userId: user.id,
            emailType: 'welcome',
          },
        });
      } catch (emailError) {
        // Log error but don't fail registration
        console.error('Failed to send welcome email:', emailError);
      }

      return {
        success: true,
        requiresPayment: selectedPlan.price > 0,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          accountStatus: user.accountStatus,
        },
      };
    }),

  // Verify reset token (public - no auth needed)
  verifyResetToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const resetToken = await ctx.prisma.passwordResetToken.findUnique({
        where: { token: input.token },
        include: { user: { select: { email: true, name: true } } },
      });

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        return { valid: false, email: null };
      }

      return { valid: true, email: resetToken.user.email };
    }),

  // Set new password via reset token (public - no auth needed)
  resetPasswordWithToken: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      const resetToken = await ctx.prisma.passwordResetToken.findUnique({
        where: { token: input.token },
        include: { user: true },
      });

      if (!resetToken) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid reset link' });
      }
      if (resetToken.usedAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This reset link has already been used' });
      }
      if (resetToken.expiresAt < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This reset link has expired' });
      }

      const hashedPassword = await hash(input.newPassword, 10);

      await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: resetToken.userId },
          data: { password: hashedPassword },
        }),
        ctx.prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        }),
      ]);

      return { success: true };
    }),
});