const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Adding 5 test users with basic membership...');

  // Get the Monthly Membership plan
  const basicPlan = await prisma.plan.findUnique({
    where: { name: 'Monthly Membership' }
  });

  if (!basicPlan) {
    console.error('❌ Monthly Membership plan not found!');
    process.exit(1);
  }

  console.log(`✅ Found plan: ${basicPlan.name} ($${basicPlan.price / 100})`);

  // Hash password for all test users
  const hashedPassword = await bcrypt.hash('TestUser123!', 10);

  const testUsers = [
    {
      email: 'john.doe@example.com',
      name: 'John Doe',
    },
    {
      email: 'sarah.smith@example.com',
      name: 'Sarah Smith',
    },
    {
      email: 'mike.johnson@example.com',
      name: 'Mike Johnson',
    },
    {
      email: 'emma.wilson@example.com',
      name: 'Emma Wilson',
    },
    {
      email: 'david.brown@example.com',
      name: 'David Brown',
    },
  ];

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create user with subscription
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: 'USER',
          subscription: {
            create: {
              planId: basicPlan.id,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            }
          }
        },
        include: {
          subscription: {
            include: {
              plan: true
            }
          }
        }
      });

      console.log(`✅ Created user: ${user.name} (${user.email}) with ${user.subscription.plan.name}`);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log('\n✅ Test users creation complete!');
  console.log('📝 Test credentials for all users: password = TestUser123!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
