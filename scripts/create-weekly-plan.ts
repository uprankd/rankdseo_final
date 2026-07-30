import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createWeeklyPlan() {
  try {
    // Check if weekly plan already exists
    const existing = await prisma.plan.findFirst({
      where: { 
        name: 'Weekly Membership',
        interval: 'week'
      }
    });

    if (existing) {
      console.log('✅ Weekly plan already exists:', existing.id);
      return existing;
    }

    // Create the weekly plan
    const weeklyPlan = await prisma.plan.create({
      data: {
        name: 'Weekly Membership',
        description: 'Full access to all backlink opportunities - billed weekly',
        price: 749, // $7.49 in cents
        interval: 'week',
        stripePriceId: null, // User needs to set this from Stripe dashboard
        stripeProductId: null,
        maxOpportunities: 999999,
        maxProjects: 999,
        allowExport: true,
        allowApiAccess: true,
        priority: 1, // Higher priority to show first
        isActive: true,
        features: {
          unlimited_opportunities: true,
          unlimited_projects: true,
          priority_support: true,
          api_access: true,
          export_data: true,
          weekly_billing: true
        }
      }
    });

    console.log('✅ Weekly plan created successfully!');
    console.log('Plan ID:', weeklyPlan.id);
    console.log('Name:', weeklyPlan.name);
    console.log('Price: $' + (weeklyPlan.price / 100).toFixed(2) + '/week');
    console.log('\n⚠️  IMPORTANT: You need to set the Stripe Price ID');
    console.log('1. Go to Stripe Dashboard > Products');
    console.log('2. Create a new price for weekly billing at $7.49');
    console.log('3. Update the plan record with stripePriceId');

    return weeklyPlan;
  } catch (error: any) {
    console.error('❌ Error creating weekly plan:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createWeeklyPlan();
