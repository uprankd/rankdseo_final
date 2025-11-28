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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, password, name, planId } = input;

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

      // Create user with subscription
      const user = await ctx.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          emailVerified: new Date(), // Auto-verify for MVP
          subscription: {
            create: {
              planId: selectedPlan.id,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          },
        },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }),
});