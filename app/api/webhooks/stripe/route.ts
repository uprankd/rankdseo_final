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

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('✅ Processing subscription.created', subscription.id);

        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Processing subscription.updated', subscription.id);

        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('❌ Processing subscription.deleted', subscription.id);

        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('💰 Processing invoice.payment_succeeded', invoice.id);

        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('❌ Processing invoice.payment_failed', invoice.id);

        await handleInvoicePaymentFailed(invoice);
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
  let transaction = await prisma.paymentTransaction.findUnique({
    where: { sessionId },
    include: { user: true },
  });

  // If transaction exists but has no user, try to find user by email and link them
  if (transaction && !transaction.userId && customerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });
    
    if (user) {
      // Link user to transaction
      transaction = await prisma.paymentTransaction.update({
        where: { sessionId },
        data: { userId: user.id },
        include: { user: true },
      });
      console.log('✅ Linked user to transaction:', user.email);
    }
  }

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
    } else {
      console.error('❌ Cannot find user to activate for session:', sessionId, 'email:', customerEmail);
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

  // Save Stripe customer ID to subscription
  if (session.customer) {
    await prisma.subscription.update({
      where: { userId: transaction.userId! },
      data: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string || undefined,
      },
    });
  }

  // Check if this is an upgrade or new signup
  const isUpgrade = 
    (transaction.metadata && typeof transaction.metadata === 'object' && 'type' in transaction.metadata && (transaction.metadata as any).type === 'UPGRADE') ||
    session.metadata?.upgradeFrom;

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
        const isLifetime = plan.name.toLowerCase().includes('lifetime');
        const nextBillingDate = !isLifetime && plan.interval !== 'lifetime' 
          ? new Date(Date.now() + (plan.interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          : undefined;

        const receiptEmail = emailTemplates.paymentReceipt(
          transaction.user.name || 'User',
          {
            invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
            transactionId: paymentIntentId || sessionId,
            transactionDbId: transaction.id,
            date: new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            planName: plan.name,
            planDescription: isLifetime ? 'One-time payment - Lifetime access' : `${plan.interval === 'yearly' ? 'Annual' : 'Monthly'} subscription`,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || 'usd',
            paymentMethod: 'stripe',
            cardLast4: session.payment_method_types?.includes('card') ? '****' : undefined,
            billingEmail: transaction.user.email,
            billingName: transaction.user.name || 'Customer',
            nextBillingDate,
            isLifetime,
          }
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
        console.log('📧 Payment receipt sent to:', transaction.user.email);
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

  // Get the plan to determine correct period end
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  let periodEnd: Date;
  if (plan?.interval === 'lifetime') {
    periodEnd = new Date(now.getTime() + 99 * 365 * 24 * 60 * 60 * 1000); // 99 years
  } else if (plan?.interval === 'year') {
    periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
  } else {
    periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }

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

  // Get the plan to determine correct period end
  const plan = await prisma.plan.findUnique({ where: { id: newPlanId } });
  let periodEnd: Date;
  if (plan?.interval === 'lifetime') {
    periodEnd = new Date(now.getTime() + 99 * 365 * 24 * 60 * 60 * 1000); // 99 years
  } else if (plan?.interval === 'year') {
    periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
  } else {
    periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }

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

// Handle subscription created (for recurring subscriptions)
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerEmail = subscription.customer as string;
  const stripeSubscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price.id;

  console.log('📝 Subscription created:', { stripeSubscriptionId, customerEmail, priceId });

  // Find user by Stripe customer ID (in subscription) or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { subscription: { stripeCustomerId: subscription.customer as string } },
        { email: customerEmail },
      ]
    },
    include: { subscription: true }
  });

  // If no user found by customer ID, try to get customer email from Stripe
  if (!user) {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      if (customer && !('deleted' in customer && customer.deleted) && 'email' in customer && customer.email) {
        user = await prisma.user.findUnique({
          where: { email: customer.email },
          include: { subscription: true }
        });
      }
    } catch (error) {
      console.error('❌ Failed to retrieve customer:', error);
    }
  }

  if (!user) {
    console.error('❌ Cannot find user for subscription:', stripeSubscriptionId);
    return;
  }

  // Find matching plan by Stripe price ID
  const plan = await prisma.plan.findFirst({
    where: { stripePriceId: priceId }
  });

  if (!plan) {
    console.error('❌ Cannot find plan for price ID:', priceId);
    return;
  }

  // Update subscription with Stripe subscription ID
  await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      stripeSubscriptionId,
      status: subscription.status === 'active' ? 'ACTIVE' : 'INCOMPLETE',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      planId: plan.id,
    }
  });

  console.log('✅ Subscription linked to user:', user.email);
}

// Handle subscription updated (renewals, status changes)
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;

  console.log('📝 Subscription updated:', stripeSubscriptionId, 'Status:', subscription.status);

  // Find subscription by Stripe ID
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
    include: { user: true }
  });

  if (!dbSubscription) {
    console.error('❌ Cannot find subscription:', stripeSubscriptionId);
    return;
  }

  // Update subscription status and period
  const updates: any = {
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  };

  // Map Stripe status to our status
  if (subscription.status === 'active') {
    updates.status = 'ACTIVE';
  } else if (subscription.status === 'canceled') {
    updates.status = 'CANCELED';
  } else if (subscription.status === 'past_due') {
    updates.status = 'PAST_DUE';
  } else if (subscription.status === 'unpaid') {
    updates.status = 'PAST_DUE';
  }

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: updates
  });

  // If subscription became active, activate user account
  if (subscription.status === 'active' && dbSubscription.user.accountStatus !== 'ACTIVE') {
    await prisma.user.update({
      where: { id: dbSubscription.userId },
      data: { accountStatus: 'ACTIVE' }
    });
    console.log('✅ User account activated:', dbSubscription.user.email);
  }

  // If subscription was canceled, downgrade to free plan
  if (subscription.status === 'canceled') {
    await downgradeToFreePlan(dbSubscription.userId);
    console.log('⬇️ User downgraded to free plan:', dbSubscription.user.email);
  }

  console.log('✅ Subscription updated:', dbSubscription.user.email);
}

// Handle subscription deleted (cancellation)
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;

  console.log('❌ Subscription deleted:', stripeSubscriptionId);

  // Find subscription
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
    include: { user: true }
  });

  if (!dbSubscription) {
    console.error('⚠️ Cannot find subscription to delete:', stripeSubscriptionId);
    return;
  }

  // Downgrade user to free plan
  await downgradeToFreePlan(dbSubscription.userId);

  console.log('✅ User downgraded after cancellation:', dbSubscription.user.email);
}

// Handle successful invoice payment (renewals)
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log('ℹ️ Invoice not associated with subscription:', invoice.id);
    return;
  }

  console.log('💰 Processing invoice payment:', invoice.id, 'for subscription:', subscriptionId);

  // Find subscription
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { user: true, plan: true }
  });

  if (!dbSubscription) {
    console.error('❌ Cannot find subscription for invoice:', invoice.id);
    return;
  }

  // Ensure user account is active
  if (dbSubscription.user.accountStatus !== 'ACTIVE') {
    await prisma.user.update({
      where: { id: dbSubscription.userId },
      data: { accountStatus: 'ACTIVE' }
    });
    console.log('✅ User account reactivated:', dbSubscription.user.email);
  }

  // Record payment transaction
  await prisma.paymentTransaction.create({
    data: {
      userId: dbSubscription.userId,
      planId: dbSubscription.planId,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency || 'usd',
      status: 'SUCCEEDED',
      sessionId: invoice.id,
      paymentIntent: invoice.payment_intent as string || null,
      stripeInvoiceId: invoice.id,
      receiptUrl: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
      metadata: { type: 'RENEWAL', subscriptionId: subscriptionId },
    },
  });

  console.log('✅ Renewal payment recorded for:', dbSubscription.user.email);

  // Send renewal receipt email
  try {
    const receiptEmail = emailTemplates.paymentReceipt(
      dbSubscription.user.name || 'User',
      {
        invoiceNumber: invoice.number || `INV-${invoice.id.slice(-8)}`,
        transactionId: invoice.payment_intent as string || invoice.id,
        transactionDbId: invoice.id,
        date: new Date(invoice.created * 1000).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        planName: dbSubscription.plan.name,
        planDescription: `${dbSubscription.plan.interval === 'yearly' ? 'Annual' : 'Monthly'} subscription renewal`,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency || 'usd',
        paymentMethod: 'stripe',
        billingEmail: dbSubscription.user.email,
        billingName: dbSubscription.user.name || 'Customer',
        nextBillingDate: new Date(dbSubscription.currentPeriodEnd).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
      }
    );
    await sendEmail({
      to: dbSubscription.user.email,
      subject: receiptEmail.subject,
      html: receiptEmail.html,
      metadata: {
        userId: dbSubscription.user.id,
        emailType: 'renewal_receipt',
        invoiceId: invoice.id,
      },
    });
    console.log('📧 Renewal receipt sent to:', dbSubscription.user.email);
  } catch (emailError) {
    console.error('⚠️ Failed to send renewal receipt:', emailError);
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log('ℹ️ Failed invoice not associated with subscription:', invoice.id);
    return;
  }

  console.log('❌ Processing failed invoice payment:', invoice.id);

  // Find subscription
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { user: true }
  });

  if (!dbSubscription) {
    console.error('❌ Cannot find subscription for failed invoice:', invoice.id);
    return;
  }

  // Mark subscription as past due
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: { status: 'PAST_DUE' }
  });

  console.log('⚠️ Subscription marked as PAST_DUE:', dbSubscription.user.email);

  // Send payment failed email
  try {
    const failedEmail = emailTemplates.paymentFailed(
      dbSubscription.user.name || 'User',
      (invoice.amount_due || 0) / 100,
      invoice.currency || 'usd'
    );
    await sendEmail({
      to: dbSubscription.user.email,
      subject: failedEmail.subject,
      html: failedEmail.html,
      metadata: {
        userId: dbSubscription.user.id,
        emailType: 'payment_failed',
        invoiceId: invoice.id,
      },
    });
    console.log('📧 Payment failed email sent to:', dbSubscription.user.email);
  } catch (emailError) {
    console.error('⚠️ Failed to send payment failed email:', emailError);
  }
}

// Downgrade user to free plan
async function downgradeToFreePlan(userId: string) {
  // Find free plan
  const freePlan = await prisma.plan.findFirst({
    where: { 
      price: 0,
      name: { contains: 'Free', mode: 'insensitive' }
    }
  });

  if (!freePlan) {
    console.error('❌ Cannot find free plan for downgrade');
    return;
  }

  // Update subscription to free plan
  await prisma.subscription.update({
    where: { userId },
    data: {
      planId: freePlan.id,
      status: 'CANCELED',
      stripeSubscriptionId: null,
    }
  });

  // Keep user account active but on free plan
  await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: 'ACTIVE' }
  });

  console.log('✅ User downgraded to free plan:', userId);
}
