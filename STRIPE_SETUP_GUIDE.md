# Stripe Payment Integration - Setup Guide

## Overview
The Stripe payment system has been fully integrated into RankdSEO. This guide will help you configure and test the payment flow.

## Current Status
✅ **Backend Implementation Complete**
- Payment tRPC router with checkout and status endpoints
- Webhook handler for payment events
- User account activation after successful payment
- Database schema updated with payment tracking

✅ **Frontend Implementation Complete**
- Signup flow integrated with Stripe checkout
- Payment success/cancel/pending pages
- Login blocking for unpaid accounts
- Error handling and user feedback

## Required Configuration

### 1. Get Stripe Test Keys
1. Create a free Stripe account at https://stripe.com
2. Go to Dashboard → Developers → API keys
3. Copy your **Test mode** keys:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)

### 2. Set Up Webhook Endpoint
1. Go to Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter webhook URL: `https://seorank-manage.preview.emergentagent.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
5. Click "Add endpoint"
6. Reveal and copy the **Signing secret** (starts with `whsec_`)

### 3. Update Environment Variables
Add the following to `/app/.env`:

```bash
# Stripe Test Keys
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET_HERE"
```

### 4. Restart the Application
```bash
sudo supervisorctl restart nextjs
```

## Testing the Payment Flow

### Test with Stripe Test Cards
Use these test card numbers in the checkout:
- **Successful payment**: `4242 4242 4242 4242`
- **Requires authentication**: `4000 0025 0000 3155`
- **Declined card**: `4000 0000 0000 0002`

For all test cards:
- Use any future expiration date (e.g., 12/25)
- Use any 3-digit CVC
- Use any ZIP code

### Complete Test Scenario

#### 1. Sign Up for Paid Plan
1. Go to `/signup`
2. Fill in your details
3. Select "Monthly Membership" or "1 Year Membership"
4. Click "Continue to Payment"
5. You'll be redirected to Stripe checkout
6. Enter test card: `4242 4242 4242 4242`
7. Complete the checkout

#### 2. Payment Success
1. You'll be redirected to `/payment/success?session_id=...`
2. Wait for payment verification (2-3 seconds)
3. You should see a success message with payment details
4. Click "Sign In to Your Account"

#### 3. Sign In
1. Use the email and password from signup
2. You should be able to login successfully
3. Your account is now ACTIVE

#### 4. Test Pending Account (Before Payment)
1. If you try to login before completing payment
2. You'll see "Payment required" error
3. You'll be redirected to `/payment/pending`

### Free Plan Testing
1. Go to `/signup`
2. Select "Free" plan (if available)
3. Click "Create Free Account"
4. Account is created immediately as ACTIVE
5. No payment required

## Features Included

### Payment Flow
- ✅ Secure Stripe checkout
- ✅ One-time payments for memberships
- ✅ Automatic invoice generation
- ✅ Receipt emails sent to customers
- ✅ Payment status tracking
- ✅ Session expiration handling

### Account Management
- ✅ PENDING status for unpaid accounts
- ✅ ACTIVE status after successful payment
- ✅ Login blocking for unpaid users
- ✅ Account activation via webhook
- ✅ Payment history tracking

### User Experience
- ✅ Clear payment instructions
- ✅ Real-time payment verification
- ✅ Helpful error messages
- ✅ Payment cancellation handling
- ✅ Mobile-responsive design

## Webhook Events Handled

### checkout.session.completed
Triggered when:
- Customer completes the checkout form
- Payment is immediately successful
- **Action**: Activate user account, update subscription

### checkout.session.async_payment_succeeded
Triggered when:
- Payment method requires additional time (bank transfers, etc.)
- Payment succeeds after delay
- **Action**: Activate user account, update subscription

### checkout.session.async_payment_failed
Triggered when:
- Delayed payment fails
- **Action**: Mark payment as failed

### checkout.session.expired
Triggered when:
- Checkout session expires (default: 24 hours)
- **Action**: Mark payment as canceled

## Database Schema

### User
- `accountStatus`: PENDING | ACTIVE | SUSPENDED | CANCELED

### PaymentTransaction
- `userId`: User who made the payment
- `planId`: Selected plan
- `amount`: Payment amount (in dollars)
- `status`: PENDING | SUCCEEDED | FAILED | CANCELED | REFUNDED
- `sessionId`: Stripe checkout session ID (unique)
- `paymentIntent`: Stripe payment intent ID
- `stripeInvoiceId`: Stripe invoice ID
- `receiptUrl`: URL to receipt/invoice
- `metadata`: Additional payment data (JSON)

## API Endpoints

### tRPC Procedures
- `payment.createSignupCheckout` - Creates checkout session (public)
- `payment.getCheckoutStatus` - Gets payment status (public)
- `payment.getUserPayments` - Gets user's payment history (protected)
- `payment.getPaymentDetails` - Gets specific payment (protected)

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Troubleshooting

### "Webhook signature verification failed"
- Check that `STRIPE_WEBHOOK_SECRET` is correct
- Ensure webhook is configured in Stripe Dashboard
- Verify endpoint URL is correct

### "Payment not activating account"
- Check webhook endpoint is publicly accessible
- View webhook delivery logs in Stripe Dashboard
- Check server logs at `/var/log/supervisor/nextjs.out.log`

### "Redirect to payment not working"
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- Check Stripe keys are in test mode
- Verify network connectivity

## Production Checklist

Before going live:
- [ ] Replace test keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Test with real payment methods
- [ ] Set up proper error monitoring
- [ ] Configure email notifications
- [ ] Review and adjust plan prices
- [ ] Test refund flow
- [ ] Set up customer support process

## Support Resources
- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Stripe Dashboard: https://dashboard.stripe.com
- Webhook Events: https://stripe.com/docs/api/events
