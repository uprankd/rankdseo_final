import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const couponRouter = router({
  // Validate coupon code (public - for signup page)
  validateCoupon: publicProcedure
    .input(
      z.object({
        code: z.string(),
        planId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { code, planId } = input;

      // Find coupon
      const coupon = await ctx.prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid coupon code',
        });
      }

      // Check if active
      if (!coupon.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This coupon is no longer active',
        });
      }

      // Check if expired
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This coupon has expired',
        });
      }

      // Check max uses
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This coupon has reached its maximum usage limit',
        });
      }

      // Check applicable plans
      if (coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(planId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This coupon is not valid for the selected plan',
        });
      }

      // Get plan details to calculate discount
      const plan = await ctx.prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan not found',
        });
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (plan.price * coupon.discountValue) / 100;
      } else {
        // FIXED_AMOUNT (in cents)
        discountAmount = coupon.discountValue * 100;
      }

      const finalPrice = Math.max(0, plan.price - discountAmount);

      return {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        originalPrice: plan.price,
        discountAmount,
        finalPrice,
      };
    }),

  // Admin: Create coupon
  createCoupon: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50),
        description: z.string().optional(),
        discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
        discountValue: z.number().min(0),
        isActive: z.boolean().default(true),
        maxUses: z.number().int().positive().optional(),
        expiresAt: z.string().datetime().optional(),
        applicablePlans: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      // Check if user is admin
      if (user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create coupons',
        });
      }

      // Validate discount value
      if (input.discountType === 'PERCENTAGE' && input.discountValue > 100) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Percentage discount cannot exceed 100%',
        });
      }

      // Create coupon
      const coupon = await ctx.prisma.coupon.create({
        data: {
          code: input.code.toUpperCase(),
          description: input.description,
          discountType: input.discountType,
          discountValue: input.discountValue,
          isActive: input.isActive,
          maxUses: input.maxUses,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          applicablePlans: input.applicablePlans,
          createdBy: user.id,
        },
      });

      return {
        success: true,
        coupon,
      };
    }),

  // Admin: List all coupons
  listCoupons: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can view coupons',
      });
    }

    const coupons = await ctx.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    return { coupons };
  }),

  // Admin: Update coupon
  updateCoupon: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string().min(1).max(50).optional(),
        description: z.string().optional(),
        discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
        discountValue: z.number().min(0).optional(),
        isActive: z.boolean().optional(),
        maxUses: z.number().int().positive().optional(),
        expiresAt: z.string().datetime().optional().nullable(),
        applicablePlans: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { id, ...updateData } = input;

      if (user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update coupons',
        });
      }

      // Validate percentage if updating
      if (
        updateData.discountType === 'PERCENTAGE' &&
        updateData.discountValue !== undefined &&
        updateData.discountValue > 100
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Percentage discount cannot exceed 100%',
        });
      }

      const coupon = await ctx.prisma.coupon.update({
        where: { id },
        data: {
          ...updateData,
          code: updateData.code ? updateData.code.toUpperCase() : undefined,
          expiresAt: updateData.expiresAt ? new Date(updateData.expiresAt) : undefined,
        },
      });

      return {
        success: true,
        coupon,
      };
    }),

  // Admin: Delete coupon
  deleteCoupon: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete coupons',
        });
      }

      await ctx.prisma.coupon.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Admin: Get coupon usage statistics
  getCouponUsage: protectedProcedure
    .input(z.object({ couponId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view coupon usage',
        });
      }

      const usages = await ctx.prisma.couponUsage.findMany({
        where: { couponId: input.couponId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { usedAt: 'desc' },
      });

      return { usages };
    }),
});
