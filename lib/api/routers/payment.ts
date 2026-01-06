import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { stripe } from '@/lib/stripe';
import { createPayPalOrder, capturePayPalOrder, getPayPalOrderDetails } from '@/lib/paypal';

export const paymentRouter = router({
  // Create checkout session for signup payment
  createSignupCheckout: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        planId: z.string(),
        couponCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, name, planId, couponCode } = input;

      // Get plan details
      const plan = await ctx.prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan not found',
        });
      }

      // Validate and apply coupon if provided
      let finalPrice = plan.price;
      let couponData = null;

      console.log('🎟️ Coupon code received:', couponCode);

      if (couponCode) {
        const coupon = await ctx.prisma.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        });

        console.log('🎟️ Coupon found:', coupon ? coupon.code : 'NOT FOUND');

        if (coupon && coupon.isActive) {
          // Check expiration
          const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
          // Check max uses
          const hasReachedLimit = coupon.maxUses && coupon.usedCount >= coupon.maxUses;
          // Check applicable plans
          const isApplicable = coupon.applicablePlans.length === 0 || coupon.applicablePlans.includes(planId);

          if (!isExpired && !hasReachedLimit && isApplicable) {
            // Calculate discount
            let discountAmount = 0;
            if (coupon.discountType === 'PERCENTAGE') {
              discountAmount = (plan.price * coupon.discountValue) / 100;
            } else {
              // FIXED_AMOUNT (convert dollars to cents)
              discountAmount = coupon.discountValue * 100;
            }

            // Round to nearest cent to avoid decimal issues with Stripe
            finalPrice = Math.round(Math.max(0, plan.price - discountAmount));
            couponData = {
              id: coupon.id,
              code: coupon.code,
              discountAmount: Math.round(discountAmount),
            };
            
            console.log('💰 Price calculation:', {
              originalPrice: plan.price,
              discountAmount: couponData.discountAmount,
              finalPrice,
              couponCode: coupon.code,
            });
          }
        }
      }

      console.log('💵 Final checkout price:', finalPrice);

      // Check if plan is free after discount
      if (finalPrice === 0) {
        return {
          isFree: true,
          url: null,
          sessionId: null,
          coupon: couponData,
        };
      }

      try {
        // Base URL for redirects
        const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

        // Create checkout session with expanded configuration
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: plan.name,
                  description: couponData 
                    ? `${plan.description} (Discount: ${couponData.code})`
                    : plan.description,
                },
                unit_amount: finalPrice, // Price after discount in cents
              },
              quantity: 1,
            },
          ],
          customer_email: email,
          metadata: {
            planId: plan.id,
            planName: plan.name,
            customerName: name,
            couponId: couponData?.id || '',
            couponCode: couponData?.code || '',
            originalPrice: plan.price.toString(),
            discountAmount: couponData?.discountAmount.toString() || '0',
          },
          // Enable automatic tax calculation if configured
          automatic_tax: {
            enabled: false,
          },
          // Enable receipt emails
          invoice_creation: {
            enabled: true,
            invoice_data: {
              description: `${plan.name} - RankdSEO Subscription`,
              metadata: {
                planId: plan.id,
                customerName: name,
              },
              custom_fields: [
                {
                  name: 'Customer Name',
                  value: name,
                },
              ],
            },
          },
          success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/payment/cancel`,
        });

        return {
          isFree: false,
          url: session.url,
          sessionId: session.id,
          coupon: couponData,
        };
      } catch (error: any) {
        console.error('Stripe checkout error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to create checkout session',
        });
      }
    }),

  // Get checkout session status
  getCheckoutStatus: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { sessionId } = input;

      try {
        // Get session from Stripe with expanded data
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items', 'customer', 'payment_intent'],
        });

        // Get transaction from database if exists
        const transaction = await ctx.prisma.paymentTransaction.findUnique({
          where: { sessionId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                accountStatus: true,
              },
            },
          },
        });

        return {
          status: session.status,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_email,
          metadata: session.metadata,
          transaction,
        };
      } catch (error: any) {
        console.error('Error fetching checkout status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch checkout status',
        });
      }
    }),

  // Get user's payment history (protected - requires login)
  getUserPayments: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    return ctx.prisma.paymentTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // Get payment details by ID
  getPaymentDetails: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { paymentId } = input;

      const payment = await ctx.prisma.paymentTransaction.findFirst({
        where: {
          id: paymentId,
          userId: user.id, // Ensure user can only view their own payments
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      return payment;
    }),

  // Create PayPal order for signup
  createPayPalSignupOrder: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        planId: z.string(),
        couponCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, name, planId, couponCode } = input;

      // Get plan details
      const plan = await ctx.prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan not found',
        });
      }

      // Calculate final price with coupon if provided
      let finalPrice = plan.price;
      let couponData = null;

      if (couponCode) {
        const coupon = await ctx.prisma.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        });

        if (coupon && coupon.isActive) {
          const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
          const hasReachedLimit = coupon.maxUses && coupon.usedCount >= coupon.maxUses;
          const isApplicable = coupon.applicablePlans.length === 0 || coupon.applicablePlans.includes(planId);

          if (!isExpired && !hasReachedLimit && isApplicable) {
            let discountAmount = 0;
            if (coupon.discountType === 'PERCENTAGE') {
              discountAmount = (plan.price * coupon.discountValue) / 100;
            } else {
              discountAmount = coupon.discountValue * 100;
            }

            finalPrice = Math.round(Math.max(0, plan.price - discountAmount));
            couponData = {
              id: coupon.id,
              code: coupon.code,
              discountAmount: Math.round(discountAmount),
            };
          }
        }
      }

      // Check if plan is free after discount
      if (finalPrice === 0) {
        return {
          isFree: true,
          orderId: null,
          coupon: couponData,
        };
      }

      try {
        // Create PayPal order
        const paypalOrder = await createPayPalOrder(finalPrice, 'USD');

        // Store order metadata in database for later processing
        // userId will be null initially and updated after signup
        await ctx.prisma.paymentTransaction.create({
          data: {
            planId: plan.id,
            amount: finalPrice / 100,
            currency: 'usd',
            status: 'PENDING',
            sessionId: paypalOrder.orderId,
            paymentMethod: 'paypal',
            user: undefined, // Explicitly don't connect to any user yet
            metadata: {
              email,
              name,
              planName: plan.name,
              couponId: couponData?.id || null,
              couponCode: couponData?.code || null,
              originalPrice: plan.price,
              discountAmount: couponData?.discountAmount || 0,
              paymentProvider: 'paypal',
            },
          },
        });

        console.log(`💳 PayPal order created: ${paypalOrder.orderId} for ${email}`);

        return {
          isFree: false,
          orderId: paypalOrder.orderId,
          coupon: couponData,
        };
      } catch (error: any) {
        console.error('PayPal order creation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to create PayPal order',
        });
      }
    }),

  // Capture PayPal payment after user approval
  capturePayPalPayment: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { orderId } = input;

      try {
        // Capture the payment
        const capture = await capturePayPalOrder(orderId);

        // Update transaction status
        await ctx.prisma.paymentTransaction.updateMany({
          where: { sessionId: orderId },
          data: {
            status: 'SUCCEEDED',
            paymentIntent: capture.captureId,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ PayPal payment captured: ${orderId}`);

        return {
          success: true,
          captureId: capture.captureId,
          status: capture.status,
        };
      } catch (error: any) {
        console.error('PayPal capture error:', error);
        
        // Update transaction to failed
        await ctx.prisma.paymentTransaction.updateMany({
          where: { sessionId: orderId },
          data: {
            status: 'FAILED',
            updatedAt: new Date(),
          },
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to capture PayPal payment',
        });
      }
    }),
});
