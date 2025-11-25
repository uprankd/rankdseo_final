const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Plans
  console.log('Creating plans...');
  const freePlan = await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {},
    create: {
      name: 'Free',
      description: 'Perfect for getting started with backlink building',
      price: 0,
      interval: 'month',
      maxOpportunities: 50,
      maxProjects: 1,
      allowExport: false,
      allowApiAccess: false,
      priority: 0,
      isActive: true,
      features: {
        opportunities: 50,
        projects: 1,
        export: false,
        api: false,
        support: 'Community'
      }
    }
  });

  const basicPlan = await prisma.plan.upsert({
    where: { name: 'Basic' },
    update: {},
    create: {
      name: 'Basic',
      description: 'For serious SEO practitioners',
      price: 2900, // $29.00 in cents
      interval: 'month',
      maxOpportunities: 1000,
      maxProjects: 5,
      allowExport: false,
      allowApiAccess: false,
      priority: 1,
      isActive: true,
      features: {
        opportunities: 1000,
        projects: 5,
        export: false,
        api: false,
        support: 'Priority Email'
      }
    }
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: {
      name: 'Pro',
      description: 'For agencies and power users',
      price: 9900, // $99.00 in cents
      interval: 'month',
      maxOpportunities: 999999,
      maxProjects: 999999,
      allowExport: true,
      allowApiAccess: true,
      priority: 2,
      isActive: true,
      features: {
        opportunities: 'Unlimited',
        projects: 'Unlimited',
        export: true,
        api: true,
        support: 'Priority + Phone'
      }
    }
  });

  console.log('✅ Plans created');

  // Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@rankseo.com' },
    update: {},
    create: {
      email: 'admin@rankseo.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: new Date(),
    }
  });

  // Create admin subscription
  await prisma.subscription.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  });

  console.log('✅ Admin user created (admin@rankseo.com / Admin123!)');

  // Sample Backlink Opportunities
  console.log('Creating backlink opportunities...');
  
  const opportunities = [
    // Technology - High DA Sites
    {
      url: 'https://www.linkedin.com/pulse',
      siteName: 'LinkedIn Pulse',
      shortDescription: 'Publish articles on LinkedIn to reach professional audience',
      fullDescription: 'LinkedIn Pulse allows professionals to publish long-form content that reaches millions of professionals. Great for building authority and getting quality backlinks.',
      category: 'Professional Network',
      niche: 'Technology',
      language: 'en',
      country: 'US',
      linkType: 'ARTICLE_SUBMISSION',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 98,
      domainRating: 99,
      estimatedTraffic: 1000000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },
    {
      url: 'https://medium.com',
      siteName: 'Medium',
      shortDescription: 'Publish stories and articles on Medium platform',
      fullDescription: 'Medium is a popular blogging platform where you can publish articles and include backlinks to your site. Great for reaching a wide audience.',
      category: 'Blogging Platform',
      niche: 'Technology',
      language: 'en',
      country: 'US',
      linkType: 'ARTICLE_SUBMISSION',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 96,
      domainRating: 95,
      estimatedTraffic: 300000000,
      spamScore: 2,
      isDofollow: true,
      status: 'ACTIVE'
    },
    {
      url: 'https://github.com',
      siteName: 'GitHub Profile',
      shortDescription: 'Add your website to your GitHub profile',
      fullDescription: 'GitHub allows you to add your website URL to your profile bio and README. Essential for developers and tech companies.',
      category: 'Developer Platform',
      niche: 'Technology',
      language: 'en',
      country: 'US',
      linkType: 'PROFILE',
      isFree: true,
      difficultyLevel: 1,
      domainAuthority: 95,
      domainRating: 94,
      estimatedTraffic: 500000000,
      spamScore: 0,
      isDofollow: true,
      status: 'ACTIVE'
    },
    {
      url: 'https://dev.to',
      siteName: 'DEV Community',
      shortDescription: 'Write technical articles and tutorials for developers',
      fullDescription: 'DEV is a community of software developers sharing articles, tutorials, and discussions. Great for tech-focused content.',
      category: 'Developer Community',
      niche: 'Technology',
      language: 'en',
      country: 'US',
      linkType: 'ARTICLE_SUBMISSION',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 82,
      domainRating: 85,
      estimatedTraffic: 15000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },
    {
      url: 'https://stackoverflow.com',
      siteName: 'Stack Overflow Profile',
      shortDescription: 'Create profile and answer questions in your expertise',
      fullDescription: 'Stack Overflow is the largest Q&A site for developers. Build reputation and add your website to your profile.',
      category: 'Q&A Platform',
      niche: 'Technology',
      language: 'en',
      country: 'US',
      linkType: 'Q_AND_A',
      isFree: true,
      difficultyLevel: 3,
      domainAuthority: 91,
      domainRating: 90,
      estimatedTraffic: 250000000,
      spamScore: 0,
      isDofollow: false,
      status: 'ACTIVE'
    },

    // Marketing
    {
      url: 'https://www.growthhackers.com',
      siteName: 'GrowthHackers',
      shortDescription: 'Share growth marketing insights and strategies',
      fullDescription: 'GrowthHackers is a community for marketing professionals to share growth strategies, case studies, and insights.',
      category: 'Marketing Community',
      niche: 'Marketing',
      language: 'en',
      country: 'US',
      linkType: 'ARTICLE_SUBMISSION',
      isFree: true,
      difficultyLevel: 3,
      domainAuthority: 68,
      domainRating: 70,
      estimatedTraffic: 2000000,
      spamScore: 2,
      isDofollow: true,
      status: 'ACTIVE'
    },
    {
      url: 'https://inbound.org',
      siteName: 'Inbound.org',
      shortDescription: 'Marketing community for sharing content and insights',
      fullDescription: 'Inbound.org is a marketing community where you can share articles, ask questions, and engage with other marketers.',
      category: 'Marketing Community',
      niche: 'Marketing',
      language: 'en',
      country: 'US',
      linkType: 'FORUM',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 71,
      domainRating: 72,
      estimatedTraffic: 1500000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },

    // Business & Finance
    {
      url: 'https://www.crunchbase.com',
      siteName: 'Crunchbase',
      shortDescription: 'Create company profile on Crunchbase',
      fullDescription: 'Crunchbase is a platform for finding business information about companies. Essential listing for startups and tech companies.',
      category: 'Business Directory',
      niche: 'Finance',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 92,
      domainRating: 90,
      estimatedTraffic: 50000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },
    {
      url: 'https://www.producthunt.com',
      siteName: 'Product Hunt',
      shortDescription: 'Launch your product and get featured',
      fullDescription: 'Product Hunt is a platform to discover and launch new products. Great exposure and quality backlink for tech products.',
      category: 'Product Directory',
      niche: 'Technology',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 3,
      domainAuthority: 88,
      domainRating: 87,
      estimatedTraffic: 25000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },

    // Social Media & Forums
    {
      url: 'https://www.reddit.com',
      siteName: 'Reddit',
      shortDescription: 'Participate in relevant subreddits and share valuable content',
      fullDescription: 'Reddit has thousands of communities (subreddits) where you can engage and share links when relevant. Follow community rules carefully.',
      category: 'Social Community',
      niche: 'General',
      language: 'en',
      country: 'US',
      linkType: 'FORUM',
      isFree: true,
      difficultyLevel: 4,
      domainAuthority: 94,
      domainRating: 96,
      estimatedTraffic: 1800000000,
      spamScore: 2,
      isDofollow: false,
      status: 'ACTIVE'
    },
    {
      url: 'https://www.quora.com',
      siteName: 'Quora',
      shortDescription: 'Answer questions in your niche and add profile link',
      fullDescription: 'Quora is a Q&A platform where you can establish expertise by answering questions. Include your website in your profile bio.',
      category: 'Q&A Platform',
      niche: 'General',
      language: 'en',
      country: 'US',
      linkType: 'Q_AND_A',
      isFree: true,
      difficultyLevel: 3,
      domainAuthority: 92,
      domainRating: 93,
      estimatedTraffic: 600000000,
      spamScore: 1,
      isDofollow: false,
      status: 'ACTIVE'
    },

    // Health & Wellness
    {
      url: 'https://www.healthline.com/guest-post',
      siteName: 'Healthline Guest Posts',
      shortDescription: 'Submit health and wellness articles',
      fullDescription: 'Healthline accepts guest posts on health, nutrition, and wellness topics. High authority health site with strict editorial standards.',
      category: 'Health Blog',
      niche: 'Health & Wellness',
      language: 'en',
      country: 'US',
      linkType: 'GUEST_POST',
      isFree: false,
      cost: 50000,
      difficultyLevel: 5,
      domainAuthority: 92,
      domainRating: 91,
      estimatedTraffic: 80000000,
      spamScore: 0,
      isDofollow: true,
      status: 'ACTIVE'
    },

    // Education
    {
      url: 'https://www.academia.edu',
      siteName: 'Academia.edu',
      shortDescription: 'Share academic papers and research',
      fullDescription: 'Academia.edu is a platform for academics to share research papers. Great for educational content and academic backlinks.',
      category: 'Academic Platform',
      niche: 'Education',
      language: 'en',
      country: 'US',
      linkType: 'ARTICLE_SUBMISSION',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 85,
      domainRating: 84,
      estimatedTraffic: 45000000,
      spamScore: 2,
      isDofollow: true,
      status: 'ACTIVE'
    },

    // Travel
    {
      url: 'https://www.tripadvisor.com',
      siteName: 'TripAdvisor Business Listing',
      shortDescription: 'List your travel business on TripAdvisor',
      fullDescription: 'TripAdvisor is the worlds largest travel platform. Essential for hotels, restaurants, and travel services.',
      category: 'Travel Directory',
      niche: 'Travel',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 93,
      domainRating: 92,
      estimatedTraffic: 400000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },

    // E-commerce
    {
      url: 'https://www.trustpilot.com',
      siteName: 'Trustpilot',
      shortDescription: 'Create business profile and collect reviews',
      fullDescription: 'Trustpilot is a review platform that builds trust. Get a quality backlink and social proof.',
      category: 'Review Platform',
      niche: 'E-commerce',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 1,
      domainAuthority: 87,
      domainRating: 88,
      estimatedTraffic: 60000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },

    // Real Estate
    {
      url: 'https://www.zillow.com/professionals',
      siteName: 'Zillow Professional Directory',
      shortDescription: 'List your real estate business on Zillow',
      fullDescription: 'Zillow is the leading real estate marketplace. Essential for real estate agents and companies.',
      category: 'Real Estate Directory',
      niche: 'Real Estate',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: false,
      cost: 0, // Free basic listing
      difficultyLevel: 2,
      domainAuthority: 91,
      domainRating: 90,
      estimatedTraffic: 200000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },

    // More Directories and Profiles (to reach 100+)
    {
      url: 'https://angel.co',
      siteName: 'AngelList (Wellfound)',
      shortDescription: 'Create startup profile on AngelList',
      fullDescription: 'AngelList (now Wellfound) connects startups with investors and talent. Essential for startup visibility.',
      category: 'Startup Directory',
      niche: 'Technology',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 85,
      domainRating: 84,
      estimatedTraffic: 20000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },
    {
      url: 'https://www.yelp.com/biz',
      siteName: 'Yelp Business',
      shortDescription: 'Create business listing on Yelp',
      fullDescription: 'Yelp is essential for local businesses. High authority local business directory with review system.',
      category: 'Local Directory',
      niche: 'General',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 1,
      domainAuthority: 93,
      domainRating: 92,
      estimatedTraffic: 180000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },
    {
      url: 'https://about.me',
      siteName: 'About.me',
      shortDescription: 'Create personal profile page',
      fullDescription: 'About.me lets you create a personal landing page with links to all your online profiles and website.',
      category: 'Profile Site',
      niche: 'General',
      language: 'en',
      country: 'US',
      linkType: 'PROFILE',
      isFree: true,
      difficultyLevel: 1,
      domainAuthority: 76,
      domainRating: 75,
      estimatedTraffic: 5000000,
      spamScore: 2,
      isDofollow: true,
      status: 'ACTIVE'
    },
    {
      url: 'https://www.behance.net',
      siteName: 'Behance',
      shortDescription: 'Showcase creative work and portfolio',
      fullDescription: 'Behance is Adobes platform for showcasing creative work. Essential for designers, artists, and creative professionals.',
      category: 'Creative Portfolio',
      niche: 'Design',
      language: 'en',
      country: 'US',
      linkType: 'PROFILE',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 89,
      domainRating: 88,
      estimatedTraffic: 35000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    },
    {
      url: 'https://dribbble.com',
      siteName: 'Dribbble',
      shortDescription: 'Share design work and get discovered',
      fullDescription: 'Dribbble is a community of designers sharing their work. Great for design portfolios and visibility.',
      category: 'Design Community',
      niche: 'Design',
      language: 'en',
      country: 'US',
      linkType: 'PROFILE',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 84,
      domainRating: 83,
      estimatedTraffic: 28000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE'
    }
  ];

  // Create opportunities with instructions
  for (const opp of opportunities) {
    const opportunity = await prisma.backlinkOpportunity.create({
      data: {
        ...opp,
        instructions: {
          create: [
            {
              stepOrder: 1,
              stepTitle: `Visit ${opp.siteName}`,
              stepDescription: `Navigate to ${opp.url} and explore the platform. Make sure you understand the community guidelines and content requirements.`,
              estimatedMinutes: 5
            },
            {
              stepOrder: 2,
              stepTitle: 'Create Account',
              stepDescription: 'Sign up for a new account if you don\'t have one. Use your business email for credibility.',
              estimatedMinutes: 10
            },
            {
              stepOrder: 3,
              stepTitle: 'Complete Profile',
              stepDescription: 'Fill out your profile completely with accurate information. Add your website URL in the designated field.',
              estimatedMinutes: 15
            },
            {
              stepOrder: 4,
              stepTitle: 'Submit Content or Listing',
              stepDescription: `${opp.linkType === 'ARTICLE_SUBMISSION' ? 'Write and submit a high-quality article relevant to your niche.' : 
                              opp.linkType === 'PROFILE' ? 'Ensure your profile is complete with your website link prominently displayed.' :
                              opp.linkType === 'BUSINESS_LISTING' ? 'Submit your business listing with complete information.' :
                              'Participate actively and add value to the community before adding your link.'}`,
              estimatedMinutes: 30
            },
            {
              stepOrder: 5,
              stepTitle: 'Verify Your Link',
              stepDescription: 'Once published, verify that your backlink is live and appears correctly. Check if it\'s dofollow using browser tools.',
              estimatedMinutes: 5
            }
          ]
        }
      }
    });
    console.log(`Created opportunity: ${opportunity.siteName}`);
  }

  console.log(`✅ Created ${opportunities.length} backlink opportunities with instructions`);

  // Create a demo project for admin
  const demoProject = await prisma.project.create({
    data: {
      userId: adminUser.id,
      name: 'My SaaS Website',
      domain: 'mysaaswebsite.com',
      niche: 'Technology',
      targetCountry: 'US',
      targetLanguage: 'en',
      description: 'Demo project for testing the backlink management system',
      color: '#3b82f6'
    }
  });

  // Add some opportunities to the demo project
  const topOpps = await prisma.backlinkOpportunity.findMany({
    take: 5,
    orderBy: { domainAuthority: 'desc' }
  });

  for (const opp of topOpps) {
    await prisma.projectOpportunity.create({
      data: {
        projectId: demoProject.id,
        opportunityId: opp.id,
        status: 'NOT_STARTED',
        priority: 3
      }
    });
  }

  console.log('✅ Demo project created with sample opportunities');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Plans: 3 (Free, Basic, Pro)`);
  console.log(`   - Users: 1 admin user`);
  console.log(`   - Opportunities: ${opportunities.length}`);
  console.log(`   - Projects: 1 demo project`);
  console.log('\n🔐 Admin Login:');
  console.log('   Email: admin@rankseo.com');
  console.log('   Password: Admin123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
