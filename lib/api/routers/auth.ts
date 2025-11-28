import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { TRPCError } from '@trpc/server';

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

      // If payment session provided, create payment transaction record
      if (paymentSessionId && selectedPlan.price > 0) {
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
});