import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import Stripe from 'stripe';
import { sendEmail, emailTemplates } from '@/lib/mailgun';

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('❌ No Stripe signature found in headers');
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`❌ Webhook signature verification failed: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('💳 Processing checkout.session.completed', session.id);

        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('💳 Processing async payment success', session.id);

        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('❌ Processing async payment failure', session.id);

        await handleCheckoutFailed(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('⏱️ Processing checkout session expiration', session.id);

        await handleCheckoutExpired(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Payment intent succeeded', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Payment intent failed', paymentIntent.id);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`❌ Error processing webhook: ${error.message}`);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle successful checkout
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const sessionId = session.id;
  const customerEmail = session.customer_email;
  const planId = session.metadata?.planId;
  const paymentIntentId = session.payment_intent as string;

  console.log('📝 Checkout details:', { sessionId, customerEmail, planId });

  // Find payment transaction
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { sessionId },
    include: { user: true },
  });

  if (!transaction) {
    console.warn('⚠️ No transaction found for session:', sessionId);
    // Try to find user by email from session
    const user = await prisma.user.findUnique({
      where: { email: customerEmail || '' },
    });

    if (user && planId) {
      // Create transaction record
      await prisma.paymentTransaction.create({
        data: {
          userId: user.id,
          planId,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency || 'usd',
          status: 'SUCCEEDED',
          sessionId,
          paymentIntent: paymentIntentId,
          metadata: session.metadata,
        },
      });

      // Activate user account
      await activateUserAccount(user.id, planId);
      
      // Record coupon usage if applicable
      if (session.metadata?.couponId && session.metadata?.couponCode) {
        await recordCouponUsage(
          session.metadata.couponId,
          user.id,
          planId,
          parseInt(session.metadata.originalPrice || '0'),
          parseInt(session.metadata.discountAmount || '0'),
          session.amount_total || 0
        );
      }
      
      console.log('✅ User account activated:', user.email);
    }
    return;
  }

  // Update transaction
  await prisma.paymentTransaction.update({
    where: { sessionId },
    data: {
      status: 'SUCCEEDED',
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      paymentIntent: paymentIntentId,
      updatedAt: new Date(),
    },
  });

  // Check if this is an upgrade or new signup
  const isUpgrade = transaction.type === 'UPGRADE' || session.metadata?.upgradeFrom;

  if (isUpgrade) {
    // Handle plan upgrade
    await upgradeUserPlan(transaction.userId!, transaction.planId!);
    console.log('✅ User plan upgraded:', transaction.user?.email);
  } else if (transaction.user && transaction.user.accountStatus === 'PENDING') {
    // Handle new signup activation
    await activateUserAccount(transaction.userId!, transaction.planId!);
    
    console.log('✅ User account activated:', transaction.user.email);
  }

  // Record coupon usage if applicable
  if (session.metadata?.couponId && session.metadata?.couponCode) {
    await recordCouponUsage(
      session.metadata.couponId,
      transaction.userId!,
      transaction.planId!,
      parseInt(session.metadata.originalPrice || '0'),
      parseInt(session.metadata.discountAmount || '0'),
      session.amount_total || 0
    );
  }

  // Retrieve expanded session to get invoice details
  try {
    const expandedSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['invoice'],
    });

    if (expandedSession.invoice) {
      const invoice = expandedSession.invoice as Stripe.Invoice;
      
      // Update transaction with invoice details
      await prisma.paymentTransaction.update({
        where: { sessionId },
        data: {
          stripeInvoiceId: invoice.id,
          receiptUrl: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
        },
      });

      console.log('📧 Invoice details saved:', invoice.id);
    }
  } catch (error) {
    console.error('⚠️ Failed to retrieve invoice details:', error);
  }

  // Send payment receipt email
  try {
    if (transaction?.user) {
      const plan = await prisma.plan.findUnique({
        where: { id: transaction.planId! },
      });
      
      if (plan) {
        const receiptEmail = emailTemplates.paymentReceipt(
          transaction.user.name || 'User',
          session.amount_total || 0,
          plan.name,
          sessionId
        );
        await sendEmail({
          to: transaction.user.email,
          subject: receiptEmail.subject,
          html: receiptEmail.html,
          metadata: {
            userId: transaction.user.id,
            emailType: 'payment_receipt',
            transactionId: transaction.id,
          },
        });
      }
    }
  } catch (emailError) {
    console.error('⚠️ Failed to send payment receipt email:', emailError);
  }
}

// Handle failed checkout
async function handleCheckoutFailed(session: Stripe.Checkout.Session) {
  const sessionId = session.id;

  await prisma.paymentTransaction.updateMany({
    where: { sessionId },
    data: {
      status: 'FAILED',
      updatedAt: new Date(),
    },
  });

  console.log('❌ Payment marked as failed:', sessionId);
}

// Handle expired checkout
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const sessionId = session.id;

  await prisma.paymentTransaction.updateMany({
    where: { sessionId },
    data: {
      status: 'CANCELED',
      updatedAt: new Date(),
    },
  });

  console.log('⏱️ Payment session expired:', sessionId);
}

// Activate user account after successful payment
async function activateUserAccount(userId: string, planId: string) {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      accountStatus: 'ACTIVE',
      subscription: {
        update: {
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      },
    },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  // Send subscription activated email
  try {
    const plan = updatedUser.subscription?.plan;
    if (plan) {
      const planFeatures = [
        `${plan.maxOpportunities} backlink opportunities`,
        `${plan.maxProjects} projects`,
        'Priority support',
        'Step-by-step tutorials',
      ];
      const activationEmail = emailTemplates.subscriptionActivated(
        updatedUser.name || 'User',
        plan.name,
        planFeatures
      );
      await sendEmail({
        to: updatedUser.email,
        subject: activationEmail.subject,
        html: activationEmail.html,
        metadata: {
          userId: updatedUser.id,
          emailType: 'subscription_activated',
          planId: plan.id,
        },
      });
    }
  } catch (emailError) {
    console.error('Failed to send subscription activated email:', emailError);
  }
}

// Upgrade user plan after successful upgrade payment
async function upgradeUserPlan(userId: string, newPlanId: string) {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      subscription: {
        update: {
          planId: newPlanId,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      },
    },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  // Send upgrade confirmation email
  try {
    const plan = updatedUser.subscription?.plan;
    if (plan) {
      const planFeatures = [
        `${plan.maxOpportunities} backlink opportunities`,
        `${plan.maxProjects} projects`,
        'Priority support',
        'Step-by-step tutorials',
      ];
      const activationEmail = emailTemplates.subscriptionActivated(
        updatedUser.name || 'User',
        plan.name,
        planFeatures
      );
      await sendEmail({
        to: updatedUser.email,
        subject: `🎉 Your Plan Has Been Upgraded to ${plan.name}!`,
        html: activationEmail.html,
        metadata: {
          userId: updatedUser.id,
          emailType: 'plan_upgraded',
          planId: plan.id,
        },
      });
    }
  } catch (emailError) {
    console.error('Failed to send upgrade confirmation email:', emailError);
  }
}

// Record coupon usage
async function recordCouponUsage(
  couponId: string,
  userId: string,
  planId: string,
  originalPrice: number,
  discountAmount: number,
  finalPrice: number
) {
  try {
    // Create coupon usage record
    await prisma.couponUsage.create({
      data: {
        couponId,
        userId,
        planId,
        originalPrice: originalPrice / 100, // Convert cents to dollars
        discountAmount: discountAmount / 100,
        finalPrice: finalPrice / 100,
      },
    });

    // Increment coupon usage count
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });

    console.log('✅ Coupon usage recorded:', couponId);
  } catch (error) {
    console.error('❌ Failed to record coupon usage:', error);
  }
}
