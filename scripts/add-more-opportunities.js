const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding 10 more backlink opportunities...');

  const opportunities = [
    {
      url: 'https://www.crunchbase.com',
      siteName: 'Crunchbase',
      shortDescription: 'Add your startup profile and get a high-authority backlink',
      fullDescription: 'Crunchbase is the leading platform for business information about private and public companies. Perfect for startups and established businesses to build credibility.',
      category: 'Business Directory',
      niche: 'Startup',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 92,
      domainRating: 94,
      estimatedTraffic: 12500000,
      spamScore: 0,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Company Profile',
          stepDescription: 'Sign up and create a detailed company profile. Add your logo, description, founding date, and team members.',
          estimatedMinutes: 20,
        },
        {
          stepOrder: 2,
          stepTitle: 'Add Company Information',
          stepDescription: 'Include your website URL, social media links, funding information, and key milestones.',
          estimatedMinutes: 15,
        },
        {
          stepOrder: 3,
          stepTitle: 'Keep Profile Updated',
          stepDescription: 'Regularly update your profile with news, funding rounds, and product launches to maintain visibility.',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      url: 'https://hackernoon.com',
      siteName: 'HackerNoon',
      shortDescription: 'Publish tech articles and reach a global developer audience',
      fullDescription: 'HackerNoon is a technology publication with millions of monthly readers. Submit guest posts on software, blockchain, AI, and startup topics.',
      category: 'Technology Blog',
      niche: 'Technology',
      language: 'en',
      country: 'US',
      linkType: 'GUEST_POST',
      isFree: true,
      difficultyLevel: 3,
      domainAuthority: 76,
      domainRating: 82,
      estimatedTraffic: 5800000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Writer Account',
          stepDescription: 'Sign up as a contributor and complete your author profile with bio and social links.',
          estimatedMinutes: 10,
        },
        {
          stepOrder: 2,
          stepTitle: 'Write Quality Article',
          stepDescription: 'Create an original article (1000+ words) on a tech topic. Follow their editorial guidelines and style.',
          estimatedMinutes: 120,
        },
        {
          stepOrder: 3,
          stepTitle: 'Submit for Review',
          stepDescription: 'Submit your article through their platform. Include your backlink naturally in the author bio or content.',
          estimatedMinutes: 5,
        },
      ],
    },
    {
      url: 'https://www.yelp.com',
      siteName: 'Yelp',
      shortDescription: 'Create a business listing for local SEO and backlinks',
      fullDescription: 'Yelp is a major local business directory with high domain authority. Essential for local businesses to improve local search rankings.',
      category: 'Local Directory',
      niche: 'Local Business',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 93,
      domainRating: 92,
      estimatedTraffic: 178000000,
      spamScore: 1,
      isDofollow: false,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Claim Your Business',
          stepDescription: 'Search for your business and claim it, or create a new listing if it doesn\'t exist.',
          estimatedMinutes: 10,
        },
        {
          stepOrder: 2,
          stepTitle: 'Complete Business Profile',
          stepDescription: 'Add photos, business hours, services, website link, and detailed description. Verify your business.',
          estimatedMinutes: 30,
        },
        {
          stepOrder: 3,
          stepTitle: 'Manage Reviews',
          stepDescription: 'Encourage customers to leave reviews and respond professionally to all feedback.',
          estimatedMinutes: 15,
        },
      ],
    },
    {
      url: 'https://www.instructables.com',
      siteName: 'Instructables',
      shortDescription: 'Share DIY tutorials and how-to guides with embedded links',
      fullDescription: 'Instructables is a community for sharing step-by-step DIY projects. Great for makers, crafters, and hobbyists to showcase expertise.',
      category: 'DIY Community',
      niche: 'DIY & Crafts',
      language: 'en',
      country: 'US',
      linkType: 'ARTICLE_SUBMISSION',
      isFree: true,
      difficultyLevel: 3,
      domainAuthority: 84,
      domainRating: 87,
      estimatedTraffic: 18500000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Account',
          stepDescription: 'Sign up and set up your maker profile. Add a profile picture and bio describing your skills.',
          estimatedMinutes: 5,
        },
        {
          stepOrder: 2,
          stepTitle: 'Create Detailed Tutorial',
          stepDescription: 'Document your project with clear steps, photos, and materials list. Make it easy to follow.',
          estimatedMinutes: 90,
        },
        {
          stepOrder: 3,
          stepTitle: 'Add Links and Publish',
          stepDescription: 'Include your website link in the intro or materials section. Tag appropriately and publish.',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      url: 'https://www.goodreads.com',
      siteName: 'Goodreads',
      shortDescription: 'Create author profile and link to your website',
      fullDescription: 'Goodreads is the world\'s largest site for readers and book recommendations. Perfect for authors, publishers, and book-related businesses.',
      category: 'Social Network',
      niche: 'Books & Publishing',
      language: 'en',
      country: 'US',
      linkType: 'PROFILE',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 94,
      domainRating: 93,
      estimatedTraffic: 98000000,
      spamScore: 0,
      isDofollow: false,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Author Profile',
          stepDescription: 'Sign up and set up your author profile. Add your bio, photo, and website link.',
          estimatedMinutes: 15,
        },
        {
          stepOrder: 2,
          stepTitle: 'Add Your Books',
          stepDescription: 'Add your books to the database if they\'re not already listed. Include covers and descriptions.',
          estimatedMinutes: 20,
        },
        {
          stepOrder: 3,
          stepTitle: 'Engage with Readers',
          stepDescription: 'Participate in discussions, answer reader questions, and build your author platform.',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      url: 'https://www.tumblr.com',
      siteName: 'Tumblr',
      shortDescription: 'Start a microblog and share content with backlinks',
      fullDescription: 'Tumblr is a microblogging platform with a creative community. Good for visual content, short posts, and building niche audiences.',
      category: 'Microblogging',
      niche: 'General',
      language: 'en',
      country: 'US',
      linkType: 'WEB_2_0',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 99,
      domainRating: 95,
      estimatedTraffic: 312000000,
      spamScore: 2,
      isDofollow: false,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Tumblr Blog',
          stepDescription: 'Sign up and create your blog with custom theme. Choose a memorable URL and customize appearance.',
          estimatedMinutes: 15,
        },
        {
          stepOrder: 2,
          stepTitle: 'Post Quality Content',
          stepDescription: 'Share images, text posts, quotes, and links. Include your website URL in posts and bio.',
          estimatedMinutes: 20,
        },
        {
          stepOrder: 3,
          stepTitle: 'Build Following',
          stepDescription: 'Follow relevant blogs, reblog content, and use hashtags to grow your audience.',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      url: 'https://www.angellist.co',
      siteName: 'AngelList',
      shortDescription: 'Create startup profile to attract investors and talent',
      fullDescription: 'AngelList (now Wellfound) connects startups with investors and job seekers. Essential for tech startups seeking funding and talent.',
      category: 'Startup Platform',
      niche: 'Startup',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 88,
      domainRating: 89,
      estimatedTraffic: 8200000,
      spamScore: 0,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Company Profile',
          stepDescription: 'Sign up and create a comprehensive startup profile. Add your pitch, team, and traction.',
          estimatedMinutes: 30,
        },
        {
          stepOrder: 2,
          stepTitle: 'Add Website and Details',
          stepDescription: 'Include your website URL, product information, funding stage, and company culture.',
          estimatedMinutes: 20,
        },
        {
          stepOrder: 3,
          stepTitle: 'Post Jobs or Funding',
          stepDescription: 'Use the platform to post job openings or funding opportunities to increase visibility.',
          estimatedMinutes: 15,
        },
      ],
    },
    {
      url: 'https://www.trustpilot.com',
      siteName: 'Trustpilot',
      shortDescription: 'Create business profile and get customer reviews',
      fullDescription: 'Trustpilot is a consumer review platform. Businesses can claim their profile and display customer reviews with a backlink.',
      category: 'Review Platform',
      niche: 'Business',
      language: 'en',
      country: 'UK',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 91,
      domainRating: 90,
      estimatedTraffic: 88000000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Claim Your Business',
          stepDescription: 'Search for your business and claim the profile, or create a new one with company details.',
          estimatedMinutes: 10,
        },
        {
          stepOrder: 2,
          stepTitle: 'Set Up Profile',
          stepDescription: 'Add your logo, description, website link, and company information. Verify your business.',
          estimatedMinutes: 15,
        },
        {
          stepOrder: 3,
          stepTitle: 'Collect Reviews',
          stepDescription: 'Send review invitations to customers and respond to all reviews professionally.',
          estimatedMinutes: 20,
        },
      ],
    },
    {
      url: 'https://www.ted.com',
      siteName: 'TED',
      shortDescription: 'Submit ideas and potentially get featured with backlinks',
      fullDescription: 'TED (Technology, Entertainment, Design) is a platform for spreading ideas through short, powerful talks. Profile pages include backlinks.',
      category: 'Content Platform',
      niche: 'Education',
      language: 'en',
      country: 'US',
      linkType: 'PROFILE',
      isFree: true,
      difficultyLevel: 5,
      domainAuthority: 94,
      domainRating: 95,
      estimatedTraffic: 45000000,
      spamScore: 0,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Speaker Profile',
          stepDescription: 'Sign up and create your profile. Highlight your expertise and speaking experience.',
          estimatedMinutes: 20,
        },
        {
          stepOrder: 2,
          stepTitle: 'Submit Talk Idea',
          stepDescription: 'Submit a compelling idea worth spreading. Make it unique, relevant, and impactful.',
          estimatedMinutes: 60,
        },
        {
          stepOrder: 3,
          stepTitle: 'Apply for TEDx',
          stepDescription: 'Apply to speak at local TEDx events. Include your website in your speaker profile.',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      url: 'https://www.scoop.it',
      siteName: 'Scoop.it',
      shortDescription: 'Curate content and share with embedded backlinks',
      fullDescription: 'Scoop.it is a content curation platform where you can collect and share articles on specific topics with backlinks to your site.',
      category: 'Content Curation',
      niche: 'General',
      language: 'en',
      country: 'US',
      linkType: 'WEB_2_0',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 76,
      domainRating: 79,
      estimatedTraffic: 2100000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Account and Topic',
          stepDescription: 'Sign up and create a topic page around your niche. Choose a focused, specific topic.',
          estimatedMinutes: 10,
        },
        {
          stepOrder: 2,
          stepTitle: 'Curate Quality Content',
          stepDescription: 'Share relevant articles from around the web with your commentary. Include your own content too.',
          estimatedMinutes: 30,
        },
        {
          stepOrder: 3,
          stepTitle: 'Add Website Links',
          stepDescription: 'Include your website link in your profile and when sharing your own content.',
          estimatedMinutes: 5,
        },
      ],
    },
  ];

  for (const oppData of opportunities) {
    const { instructions, ...opportunityData } = oppData;
    
    try {
      const opportunity = await prisma.backlinkOpportunity.create({
        data: {
          ...opportunityData,
          instructions: {
            create: instructions,
          },
        },
      });
      console.log(`✅ Created: ${opportunity.siteName}`);
    } catch (error) {
      console.error(`❌ Failed to create ${oppData.siteName}:`, error.message);
    }
  }

  console.log('\n🎉 Done! 10 more opportunities added.');
  console.log('\n📊 Total opportunities in database:');
  const count = await prisma.backlinkOpportunity.count();
  console.log(`   ${count} opportunities`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
