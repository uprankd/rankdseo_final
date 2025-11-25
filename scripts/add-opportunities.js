const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding 10 new backlink opportunities...');

  const opportunities = [
    {
      url: 'https://medium.com',
      siteName: 'Medium',
      shortDescription: 'Publish high-quality articles on Medium to reach millions of readers',
      fullDescription: 'Medium is one of the largest blogging platforms with over 100 million monthly readers. You can include backlinks in your articles and author bio.',
      category: 'Content Platform',
      niche: 'General',
      language: 'en',
      country: 'US',
      linkType: 'ARTICLE_SUBMISSION',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 96,
      domainRating: 94,
      estimatedTraffic: 215000000,
      spamScore: 1,
      isDofollow: false,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create a Medium Account',
          stepDescription: 'Sign up for a free Medium account using your email or Google account. Complete your profile with a professional photo and bio.',
          estimatedMinutes: 5,
        },
        {
          stepOrder: 2,
          stepTitle: 'Write Quality Content',
          stepDescription: 'Create an article (minimum 500 words) that provides value to readers. Include your backlink naturally within the content or in your author bio.',
          estimatedMinutes: 60,
        },
        {
          stepOrder: 3,
          stepTitle: 'Publish and Promote',
          stepDescription: 'Publish your article and share it on social media. Engage with comments to increase visibility.',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      url: 'https://www.reddit.com',
      siteName: 'Reddit',
      shortDescription: 'Share content and build backlinks through Reddit communities',
      fullDescription: 'Reddit has thousands of niche communities (subreddits) where you can share content and engage with users. Build karma and trust before sharing links.',
      category: 'Social Network',
      niche: 'General',
      language: 'en',
      country: 'US',
      linkType: 'SOCIAL',
      isFree: true,
      difficultyLevel: 4,
      domainAuthority: 91,
      domainRating: 96,
      estimatedTraffic: 1600000000,
      spamScore: 2,
      isDofollow: false,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Reddit Account',
          stepDescription: 'Sign up for Reddit and spend time understanding the platform culture. Build karma by participating in discussions.',
          estimatedMinutes: 10,
        },
        {
          stepOrder: 2,
          stepTitle: 'Find Relevant Subreddits',
          stepDescription: 'Identify subreddits related to your niche. Read the rules carefully as many communities have strict anti-spam policies.',
          estimatedMinutes: 20,
        },
        {
          stepOrder: 3,
          stepTitle: 'Engage and Share',
          stepDescription: 'Participate genuinely in discussions. Share your link only when it adds value. Be prepared to answer questions.',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      url: 'https://dev.to',
      siteName: 'DEV Community',
      shortDescription: 'Share programming and tech articles with developer community',
      fullDescription: 'DEV.to is a community of developers sharing knowledge. Perfect for tech-related content with dofollow backlinks.',
      category: 'Technology',
      niche: 'Software Development',
      language: 'en',
      country: 'US',
      linkType: 'ARTICLE_SUBMISSION',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 80,
      domainRating: 85,
      estimatedTraffic: 8500000,
      spamScore: 0,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Join DEV Community',
          stepDescription: 'Create your account and set up your developer profile. Add your skills and interests.',
          estimatedMinutes: 5,
        },
        {
          stepOrder: 2,
          stepTitle: 'Write Technical Article',
          stepDescription: 'Write a tutorial, guide, or share your development experience. Use code blocks and images to enhance your post.',
          estimatedMinutes: 90,
        },
        {
          stepOrder: 3,
          stepTitle: 'Add Backlink and Publish',
          stepDescription: 'Include your website link in the article body or author section. Tag your article appropriately and publish.',
          estimatedMinutes: 5,
        },
      ],
    },
    {
      url: 'https://www.quora.com',
      siteName: 'Quora',
      shortDescription: 'Answer questions and include helpful links to your content',
      fullDescription: 'Quora is a Q&A platform where you can establish authority by answering questions in your niche and including relevant backlinks.',
      category: 'Q&A Platform',
      niche: 'General',
      language: 'en',
      country: 'US',
      linkType: 'Q_AND_A',
      isFree: true,
      difficultyLevel: 3,
      domainAuthority: 93,
      domainRating: 91,
      estimatedTraffic: 300000000,
      spamScore: 1,
      isDofollow: false,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Set Up Quora Profile',
          stepDescription: 'Create a comprehensive profile highlighting your expertise. Add credentials and areas of knowledge.',
          estimatedMinutes: 10,
        },
        {
          stepOrder: 2,
          stepTitle: 'Find Relevant Questions',
          stepDescription: 'Search for questions in your niche. Follow topics related to your industry.',
          estimatedMinutes: 15,
        },
        {
          stepOrder: 3,
          stepTitle: 'Provide Value with Links',
          stepDescription: 'Write detailed, helpful answers (200+ words). Include your backlink naturally when it genuinely helps answer the question.',
          estimatedMinutes: 20,
        },
      ],
    },
    {
      url: 'https://github.com',
      siteName: 'GitHub',
      shortDescription: 'Create repositories and link to your website in README files',
      fullDescription: 'GitHub allows dofollow backlinks in repository descriptions and README files. Great for tech companies and developers.',
      category: 'Technology',
      niche: 'Software Development',
      language: 'en',
      country: 'US',
      linkType: 'PROFILE',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 95,
      domainRating: 96,
      estimatedTraffic: 185000000,
      spamScore: 0,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create GitHub Account',
          stepDescription: 'Sign up for GitHub and complete your developer profile. Add your website to your profile.',
          estimatedMinutes: 5,
        },
        {
          stepOrder: 2,
          stepTitle: 'Create a Repository',
          stepDescription: 'Create a public repository with useful code, tools, or documentation relevant to your niche.',
          estimatedMinutes: 30,
        },
        {
          stepOrder: 3,
          stepTitle: 'Add Backlinks',
          stepDescription: 'Include your website link in the repository description and README.md file. Add context about your project.',
          estimatedMinutes: 5,
        },
      ],
    },
    {
      url: 'https://www.producthunt.com',
      siteName: 'Product Hunt',
      shortDescription: 'Launch your product and get high-quality backlinks',
      fullDescription: 'Product Hunt is the place to discover and launch new products. Great for startups and SaaS companies to get visibility and backlinks.',
      category: 'Startup',
      niche: 'Technology',
      language: 'en',
      country: 'US',
      linkType: 'BUSINESS_LISTING',
      isFree: true,
      difficultyLevel: 3,
      domainAuthority: 89,
      domainRating: 90,
      estimatedTraffic: 4200000,
      spamScore: 1,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Account and Profile',
          stepDescription: 'Sign up and build your maker profile. Add your bio, avatar, and social links.',
          estimatedMinutes: 10,
        },
        {
          stepOrder: 2,
          stepTitle: 'Prepare Your Launch',
          stepDescription: 'Create compelling product description, screenshots, and demo video. Choose the right category and tags.',
          estimatedMinutes: 120,
        },
        {
          stepOrder: 3,
          stepTitle: 'Launch Your Product',
          stepDescription: 'Submit your product and engage with the community. Respond to comments and questions promptly.',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      url: 'https://www.pinterest.com',
      siteName: 'Pinterest',
      shortDescription: 'Create pins linking to your content and website',
      fullDescription: 'Pinterest is a visual discovery platform perfect for lifestyle, DIY, recipes, and design content. Pins can drive significant traffic.',
      category: 'Social Media',
      niche: 'Lifestyle',
      language: 'en',
      country: 'US',
      linkType: 'SOCIAL',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 94,
      domainRating: 95,
      estimatedTraffic: 463000000,
      spamScore: 1,
      isDofollow: false,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Set Up Business Account',
          stepDescription: 'Create a Pinterest Business account and verify your website. Complete your profile with branding.',
          estimatedMinutes: 15,
        },
        {
          stepOrder: 2,
          stepTitle: 'Create Eye-Catching Pins',
          stepDescription: 'Design vertical pins (1000x1500px) with compelling images and text overlays. Use Canva or similar tools.',
          estimatedMinutes: 30,
        },
        {
          stepOrder: 3,
          stepTitle: 'Pin with Links',
          stepDescription: 'Upload your pins with keyword-rich descriptions and link back to your website. Create relevant boards.',
          estimatedMinutes: 15,
        },
      ],
    },
    {
      url: 'https://www.slideshare.net',
      siteName: 'SlideShare',
      shortDescription: 'Upload presentations with backlinks to your website',
      fullDescription: 'SlideShare (LinkedIn SlideShare) is a platform for sharing presentations. Great for B2B and educational content.',
      category: 'Content Platform',
      niche: 'Business',
      language: 'en',
      country: 'US',
      linkType: 'ARTICLE_SUBMISSION',
      isFree: true,
      difficultyLevel: 3,
      domainAuthority: 95,
      domainRating: 92,
      estimatedTraffic: 65000000,
      spamScore: 1,
      isDofollow: false,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create SlideShare Account',
          stepDescription: 'Sign up using your LinkedIn account. Complete your profile with professional information.',
          estimatedMinutes: 5,
        },
        {
          stepOrder: 2,
          stepTitle: 'Design Your Presentation',
          stepDescription: 'Create a valuable presentation (10-20 slides) using PowerPoint or Google Slides. Focus on providing insights.',
          estimatedMinutes: 90,
        },
        {
          stepOrder: 3,
          stepTitle: 'Upload with Backlinks',
          stepDescription: 'Upload your presentation. Add your website link in the description and on the final slide as a CTA.',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      url: 'https://www.behance.net',
      siteName: 'Behance',
      shortDescription: 'Showcase creative work and link to your portfolio website',
      fullDescription: 'Behance is Adobe\'s creative portfolio platform. Perfect for designers, artists, and creative agencies to showcase work.',
      category: 'Creative',
      niche: 'Design',
      language: 'en',
      country: 'US',
      linkType: 'PROFILE',
      isFree: true,
      difficultyLevel: 2,
      domainAuthority: 92,
      domainRating: 93,
      estimatedTraffic: 45000000,
      spamScore: 0,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create Behance Profile',
          stepDescription: 'Sign up with Adobe ID and create your creative profile. Add your skills, location, and bio.',
          estimatedMinutes: 10,
        },
        {
          stepOrder: 2,
          stepTitle: 'Upload Your Best Work',
          stepDescription: 'Create project showcases with high-quality images. Write detailed project descriptions explaining your process.',
          estimatedMinutes: 60,
        },
        {
          stepOrder: 3,
          stepTitle: 'Add Website Links',
          stepDescription: 'Link to your website in your profile and project descriptions. Tag your work appropriately for discovery.',
          estimatedMinutes: 5,
        },
      ],
    },
    {
      url: 'https://www.youtube.com',
      siteName: 'YouTube',
      shortDescription: 'Create video content with website links in descriptions',
      fullDescription: 'YouTube is the world\'s largest video platform. Video descriptions allow dofollow backlinks and can drive significant traffic.',
      category: 'Video Platform',
      niche: 'General',
      language: 'en',
      country: 'US',
      linkType: 'SOCIAL',
      isFree: true,
      difficultyLevel: 4,
      domainAuthority: 100,
      domainRating: 99,
      estimatedTraffic: 8500000000,
      spamScore: 0,
      isDofollow: true,
      status: 'ACTIVE',
      instructions: [
        {
          stepOrder: 1,
          stepTitle: 'Create YouTube Channel',
          stepDescription: 'Set up your channel with branding, banner, profile picture, and channel description. Add your website link.',
          estimatedMinutes: 20,
        },
        {
          stepOrder: 2,
          stepTitle: 'Create Quality Videos',
          stepDescription: 'Produce valuable video content for your audience. Focus on solving problems or entertaining your niche.',
          estimatedMinutes: 180,
        },
        {
          stepOrder: 3,
          stepTitle: 'Optimize with Backlinks',
          stepDescription: 'Write keyword-optimized descriptions with your website link at the top. Add links in pinned comments and cards.',
          estimatedMinutes: 15,
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

  console.log('\n🎉 Done! 10 new opportunities added.');
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
