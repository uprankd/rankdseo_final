import { PrismaClient } from '@prisma/client';
import { stripe } from '../lib/stripe';

const prisma = new PrismaClient();

async function setupWeeklyPlanInStripe() {
  try {
    console.log('🔄 Setting up Weekly Plan in Stripe...\n');

    // Get the weekly plan from database
    const weeklyPlan = await prisma.plan.findFirst({
      where: { 
        name: 'Weekly Membership',
        interval: 'week'
      }
    });

    if (!weeklyPlan) {
      throw new Error('Weekly plan not found in database. Run create-weekly-plan.ts first.');
    }

    console.log('✅ Found weekly plan in database:', weeklyPlan.id);

    // Check if Stripe product/price already exists
    if (weeklyPlan.stripeProductId && weeklyPlan.stripePriceId) {
      console.log('⚠️  Stripe IDs already exist:');
      console.log('   Product ID:', weeklyPlan.stripeProductId);
      console.log('   Price ID:', weeklyPlan.stripePriceId);
      console.log('\n✅ Weekly plan is already configured!');
      return;
    }

    // Create Stripe Product
    console.log('\n🔄 Creating Stripe Product...');
    const stripeProduct = await stripe.products.create({
      name: 'Weekly Membership',
      description: 'Full access to all backlink opportunities - billed weekly',
      metadata: {
        planId: weeklyPlan.id,
        interval: 'week',
      },
    });
    console.log('✅ Stripe Product created:', stripeProduct.id);

    // Create Stripe Price (recurring weekly)
    console.log('\n🔄 Creating Stripe Price (weekly recurring)...');
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: 749, // $7.49 in cents
      currency: 'usd',
      recurring: {
        interval: 'week',
        interval_count: 1,
      },
      metadata: {
        planId: weeklyPlan.id,
      },
    });
    console.log('✅ Stripe Price created:', stripePrice.id);
    console.log('   Amount: $7.49/week');

    // Update database with Stripe IDs
    console.log('\n🔄 Updating database with Stripe IDs...');
    await prisma.plan.update({
      where: { id: weeklyPlan.id },
      data: {
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
      },
    });
    console.log('✅ Database updated successfully!');

    console.log('\n' + '='.repeat(60));
    console.log('✅ WEEKLY PLAN SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('Plan Details:');
    console.log('  Database ID:', weeklyPlan.id);
    console.log('  Name:', weeklyPlan.name);
    console.log('  Price: $7.49/week');
    console.log('  Stripe Product ID:', stripeProduct.id);
    console.log('  Stripe Price ID:', stripePrice.id);
    console.log('\n🎉 Users can now purchase the weekly plan!');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Error setting up weekly plan in Stripe:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupWeeklyPlanInStripe();
