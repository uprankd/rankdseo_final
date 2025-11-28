import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

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

  // Activate user account if still pending
  if (transaction.user && transaction.user.accountStatus === 'PENDING') {
    await activateUserAccount(transaction.userId!, transaction.planId!);
    console.log('✅ User account activated:', transaction.user.email);
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

  await prisma.user.update({
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
  });
}
