import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyWeeklyPlan() {
  const plan = await prisma.plan.findFirst({
    where: { interval: 'week' }
  });
  
  console.log('\n✅ Weekly Plan Verification:');
  console.log('========================================');
  console.log('Name:', plan?.name);
  console.log('Price:', plan?.price, 'cents ($' + (plan?.price ? plan.price / 100 : 0) + ')');
  console.log('Interval:', plan?.interval);
  console.log('Stripe Product ID:', plan?.stripeProductId);
  console.log('Stripe Price ID:', plan?.stripePriceId);
  console.log('Active:', plan?.isActive);
  console.log('========================================\n');
  
  await prisma.$disconnect();
}

verifyWeeklyPlan();
