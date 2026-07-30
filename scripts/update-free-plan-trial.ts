import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateFreePlanToTrial() {
  try {
    console.log('🔄 Updating Free Plan to 3-Day Trial...\n');

    // Find the free plan
    const freePlan = await prisma.plan.findFirst({
      where: { 
        price: 0,
        name: { contains: 'Free' }
      }
    });

    if (!freePlan) {
      console.log('⚠️  No free plan found');
      return;
    }

    console.log('✅ Found free plan:', freePlan.id);

    // Update the free plan
    const updated = await prisma.plan.update({
      where: { id: freePlan.id },
      data: {
        name: '3-Day Free Trial',
        description: 'Try RankdSEO free for 3 days - Choose your plan after trial',
        maxOpportunities: 10, // Changed from 20 to 10
        features: {
          trial_period: '3 days',
          max_opportunities: 10,
          requires_card: true,
          converts_to_paid: true,
          step_by_step_guides: true,
          email_support: true
        }
      }
    });

    console.log('\n✅ Free plan updated to trial:');
    console.log('   Name:', updated.name);
    console.log('   Description:', updated.description);
    console.log('   Max Opportunities:', updated.maxOpportunities);
    console.log('   Requires Card: Yes');
    console.log('   Trial Period: 3 days');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateFreePlanToTrial();
