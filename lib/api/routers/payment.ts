import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { stripe } from '@/lib/stripe';

export const paymentRouter = router({
  // Create checkout session for signup payment
  createSignupCheckout: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        planId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, name, planId } = input;

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

      // Check if plan is free - no payment needed
      if (plan.price === 0) {
        return {
          isFree: true,
          url: null,
          sessionId: null,
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
                  description: plan.description,
                },
                unit_amount: plan.price, // Already in cents
              },
              quantity: 1,
            },
          ],
          customer_email: email,
          metadata: {
            planId: plan.id,
            planName: plan.name,
            customerName: name,
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
});
