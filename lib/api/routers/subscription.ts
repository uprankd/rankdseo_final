import { router, protectedProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { stripe } from '../../stripe';
import { createPayPalOrder, capturePayPalOrder } from '../../paypal';
import { sendEmail, emailTemplates } from '../../mailgun';

export const subscriptionRouter = router({
  getPublicPlans: publicProcedure.query(async ({ ctx }) => {
    try {
      const plans = await ctx.prisma.plan.findMany({
        where: { isActive: true, name: { not: '3 Month Membership' } },
        orderBy: { priority: 'asc' },
      });

      return { plans };
    } catch (error) {
      // If database is unavailable, return empty array
      // Frontend will use fallback plans
      console.error('Database error in getPublicPlans:', error);
      return { plans: [] };
    }
  }),

  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
      include: { plan: true },
    });

    return subscription;
  }),

  getPlans: protectedProcedure.query(async ({ ctx }) => {
    const plans = await ctx.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });

    return plans;
  }),

  listPlans: protectedProcedure.query(async ({ ctx }) => {
    const plans = await ctx.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });

    return plans;
  }),

  updateSubscription: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!subscription) {
        // Create new subscription if doesn't exist
        await ctx.prisma.subscription.create({
          data: {
            userId: ctx.user.id,
            planId: input.planId,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });
      } else {
        // Update existing subscription
        await ctx.prisma.subscription.update({
          where: { userId: ctx.user.id },
          data: {
            planId: input.planId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return { success: true };
    }),

  // New mutation for upgrading plan with Stripe payment
  createUpgradeCheckout: protectedProcedure
    .input(z.object({ 
      planId: z.string(),
      couponCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { planId, couponCode } = input;

      // Get the target plan
      const plan = await ctx.prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan not found',
        });
      }

      // Get current subscription
      const currentSubscription = await ctx.prisma.subscription.findUnique({
        where: { userId: ctx.user.id },
        include: { plan: true },
      });

      if (!currentSubscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active subscription found',
        });
      }

      // Check if target plan is free
      if (plan.price === 0) {
        // If upgrading to free plan, just update directly
        await ctx.prisma.subscription.update({
          where: { userId: ctx.user.id },
          data: {
            planId: plan.id,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        return { 
          success: true, 
          requiresPayment: false,
          message: 'Plan updated successfully',
        };
      }

      // Validate plan price
      if (!plan.price || isNaN(plan.price) || plan.price < 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid plan pricing configuration',
        });
      }

      // Check if downgrading (current plan is more expensive than target)
      if (currentSubscription.plan.price >= plan.price && plan.price > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot downgrade to a less expensive plan. Please cancel your current subscription first.',
        });
      }

      console.log(`💳 Creating upgrade checkout for user ${ctx.user.email}: ${currentSubscription.plan.name} → ${plan.name} ($${(plan.price / 100).toFixed(2)})`);

      // Create Stripe checkout session for upgrade
      try {
        const sessionParams: any = {
          mode: 'payment' as const,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: plan.name,
                  description: plan.description || undefined,
                },
                unit_amount: plan.price,
              },
              quantity: 1,
            },
          ],
          customer_email: ctx.user.email,
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgrade=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgrade=cancelled`,
          metadata: {
            userId: ctx.user.id,
            planId: plan.id,
            upgradeFrom: currentSubscription.planId,
          },
        };

        // Handle coupon if provided
        let couponData = null;
        if (couponCode) {
          const coupon = await ctx.prisma.coupon.findFirst({
            where: {
              code: couponCode,
              isActive: true,
              OR: [
                { expiresAt: null },
                { expiresAt: { gte: new Date() } },
              ],
            },
          });

          if (coupon) {
            // Check usage limit
            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Coupon has reached its usage limit',
              });
            }

            // Check if user already used this coupon
            const existingUsage = await ctx.prisma.couponUsage.findFirst({
              where: {
                couponId: coupon.id,
                userId: ctx.user.id,
              },
            });

            if (existingUsage) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'You have already used this coupon',
              });
            }

            // Calculate discount
            const discountAmount = Math.floor(plan.price * (coupon.discountValue / 100));
            const finalPrice = plan.price - discountAmount;

            console.log(`🎫 Coupon applied: ${coupon.code} (${coupon.discountValue}% off)`);
            console.log(`💰 Original: $${(plan.price / 100).toFixed(2)}, Discount: $${(discountAmount / 100).toFixed(2)}, Final: $${(finalPrice / 100).toFixed(2)}`);

            // If coupon makes the plan free or negative, upgrade directly without payment
            if (finalPrice <= 0) {
              await ctx.prisma.subscription.update({
                where: { userId: ctx.user.id },
                data: {
                  planId: plan.id,
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
              });

              // Record the coupon usage
              await ctx.prisma.couponUsage.create({
                data: {
                  couponId: coupon.id,
                  userId: ctx.user.id,
                },
              });

              // Increment coupon usage count
              await ctx.prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } },
              });

              return {
                success: true,
                requiresPayment: false,
                message: `Plan upgraded successfully with ${coupon.discountValue}% discount! No payment required.`,
              };
            }

            // Update line items with discounted price
            sessionParams.line_items = [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: `${plan.name} (${coupon.discountValue}% off)`,
                    description: `Original: $${(plan.price / 100).toFixed(2)} | Discount: ${coupon.discountValue}%`,
                  },
                  unit_amount: finalPrice,
                },
                quantity: 1,
              },
            ];

            sessionParams.metadata.couponId = coupon.id;
            sessionParams.metadata.couponCode = coupon.code;
            sessionParams.metadata.originalPrice = plan.price.toString();
            sessionParams.metadata.discountAmount = discountAmount.toString();

            couponData = {
              id: coupon.id,
              code: coupon.code,
              discountPercent: coupon.discountValue, // Use discountValue from DB
              originalPrice: plan.price,
              discountAmount,
              finalPrice,
            };
          }
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        // Create payment transaction record
        await ctx.prisma.paymentTransaction.create({
          data: {
            userId: ctx.user.id,
            planId: plan.id,
            amount: couponData ? couponData.finalPrice / 100 : plan.price / 100,
            currency: 'usd',
            status: 'PENDING',
            sessionId: session.id,
            metadata: {
              type: 'UPGRADE', // Store in metadata instead
              planName: plan.name,
              upgradeFrom: currentSubscription.plan.name,
              customerName: ctx.user.name,
              ...(couponData && { coupon: couponData }),
            },
          },
        });

        return {
          success: true,
          requiresPayment: true,
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      } catch (error: any) {
        console.error('Stripe checkout error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
        });
      }
    }),

  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
      include: { plan: true },
    });

    if (!subscription) {
      return null;
    }

    const projectCount = await ctx.prisma.project.count({
      where: { userId: ctx.user.id },
    });

    const opportunityCount = await ctx.prisma.projectOpportunity.count({
      where: {
        project: { userId: ctx.user.id },
      },
    });

    return {
      projects: {
        used: projectCount,
        limit: subscription.plan.maxProjects,
      },
      opportunities: {
        used: opportunityCount,
        limit: subscription.plan.maxOpportunities,
      },
    };
  }),

  // Create PayPal order for plan upgrade (existing users)
  createPayPalUpgradeOrder: protectedProcedure
    .input(z.object({
      planId: z.string(),
      couponCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { planId, couponCode } = input;

      const plan = await ctx.prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }

      const currentSubscription = await ctx.prisma.subscription.findUnique({
        where: { userId: ctx.user.id },
        include: { plan: true },
      });

      if (!currentSubscription) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription found' });
      }

      // Free plan — switch directly
      if (plan.price === 0) {
        await ctx.prisma.subscription.update({
          where: { userId: ctx.user.id },
          data: {
            planId: plan.id,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        return { requiresPayment: false, orderId: null, message: 'Plan updated successfully' };
      }

      // Block downgrades
      if (currentSubscription.plan.price >= plan.price && plan.price > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot downgrade to a less expensive plan. Please cancel your current subscription first.',
        });
      }

      // Apply coupon
      let finalPrice = plan.price;
      let couponData: any = null;

      if (couponCode) {
        const coupon = await ctx.prisma.coupon.findFirst({
          where: {
            code: couponCode.toUpperCase(),
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
          },
        });

        if (coupon) {
          if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Coupon has reached its usage limit' });
          }
          const existingUsage = await ctx.prisma.couponUsage.findFirst({
            where: { couponId: coupon.id, userId: ctx.user.id },
          });
          if (existingUsage) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'You have already used this coupon' });
          }

          const discountAmount = Math.floor(plan.price * (coupon.discountValue / 100));
          finalPrice = Math.max(0, plan.price - discountAmount);
          couponData = { id: coupon.id, code: coupon.code, discountValue: coupon.discountValue, discountAmount, finalPrice };

          // If free after coupon, upgrade directly
          if (finalPrice <= 0) {
            await ctx.prisma.subscription.update({
              where: { userId: ctx.user.id },
              data: { planId: plan.id, currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            });
            await ctx.prisma.couponUsage.create({ data: { couponId: coupon.id, userId: ctx.user.id } });
            await ctx.prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
            return { requiresPayment: false, orderId: null, message: `Plan upgraded with ${coupon.discountValue}% discount! No payment required.` };
          }
        }
      }

      // Create PayPal order
      const paypalOrder = await createPayPalOrder(finalPrice, 'USD');

      await ctx.prisma.paymentTransaction.create({
        data: {
          userId: ctx.user.id,
          planId: plan.id,
          amount: finalPrice / 100,
          currency: 'usd',
          status: 'PENDING',
          sessionId: paypalOrder.orderId,
          paymentMethod: 'paypal',
          metadata: {
            type: 'UPGRADE',
            planName: plan.name,
            upgradeFrom: currentSubscription.plan.name,
            customerName: ctx.user.name,
            ...(couponData && { coupon: couponData }),
          },
        },
      });

      console.log(`💳 PayPal upgrade order created: ${paypalOrder.orderId} for ${ctx.user.email} (${currentSubscription.plan.name} → ${plan.name})`);

      return { requiresPayment: true, orderId: paypalOrder.orderId };
    }),

  // Capture PayPal payment for plan upgrade
  capturePayPalUpgradePayment: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { orderId } = input;

      // Find the pending transaction
      const transaction = await ctx.prisma.paymentTransaction.findFirst({
        where: { sessionId: orderId, userId: ctx.user.id, status: 'PENDING' },
      });

      if (!transaction || !transaction.planId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Transaction not found' });
      }

      // Capture the payment
      const capture = await capturePayPalOrder(orderId);

      // Update transaction
      await ctx.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCEEDED', paymentIntent: capture.captureId, updatedAt: new Date() },
      });

      // Upgrade the subscription
      const now = new Date();
      const plan = await ctx.prisma.plan.findUnique({ where: { id: transaction.planId } });
      let periodEnd: Date;
      if (plan?.interval === 'lifetime') {
        periodEnd = new Date(now.getTime() + 99 * 365 * 24 * 60 * 60 * 1000);
      } else if (plan?.interval === 'year') {
        periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else {
        periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      await ctx.prisma.subscription.update({
        where: { userId: ctx.user.id },
        data: {
          planId: transaction.planId,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      // Record coupon usage if applicable
      const meta = transaction.metadata as any;
      if (meta?.coupon?.id) {
        try {
          await ctx.prisma.couponUsage.create({ data: { couponId: meta.coupon.id, userId: ctx.user.id } });
          await ctx.prisma.coupon.update({ where: { id: meta.coupon.id }, data: { usedCount: { increment: 1 } } });
        } catch (e) { /* coupon already used — ignore */ }
      }

      // Send confirmation email
      try {
        if (plan) {
          const planFeatures = [
            `${plan.maxOpportunities} backlink opportunities`,
            `${plan.maxProjects} projects`,
            'Priority support',
            'Step-by-step tutorials',
          ];
          const activationEmail = emailTemplates.subscriptionActivated(
            ctx.user.name || 'User',
            plan.name,
            planFeatures,
          );
          await sendEmail({
            to: ctx.user.email,
            subject: `Your Plan Has Been Upgraded to ${plan.name}!`,
            html: activationEmail.html,
          });
        }
      } catch (emailError) {
        console.error('Failed to send upgrade email:', emailError);
      }

      console.log(`✅ PayPal upgrade captured: ${orderId} — ${ctx.user.email} upgraded to ${plan?.name}`);

      return { success: true, planName: plan?.name };
    }),
});