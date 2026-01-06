const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const prisma = new PrismaClient();

// Function to download image
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Parse HTML content to extract tutorial steps
function parseStepsFromContent(content) {
  const steps = [];
  const stepRegex = /<p><strong>(\d+)\.<\/strong>(.*?)<\/p>/gs;
  let match;
  let stepOrder = 1;
  
  while ((match = stepRegex.exec(content)) !== null) {
    const title = match[2].trim().replace(/<[^>]*>/g, '');
    if (title) {
      steps.push({
        stepOrder: stepOrder++,
        stepTitle: title.substring(0, 100),
        stepDescription: title,
        estimatedMinutes: 2,
      });
    }
  }
  
  // If no steps found with that pattern, try another pattern
  if (steps.length === 0) {
    const lines = content.split('\n');
    let stepCount = 0;
    
    for (const line of lines) {
      const cleanLine = line.replace(/<[^>]*>/g, '').trim();
      if (cleanLine && cleanLine.length > 10 && stepCount < 10) {
        stepCount++;
        steps.push({
          stepOrder: stepCount,
          stepTitle: `Step ${stepCount}`,
          stepDescription: cleanLine.substring(0, 500),
          estimatedMinutes: 2,
        });
      }
    }
  }
  
  // Ensure at least one step
  if (steps.length === 0) {
    steps.push({
      stepOrder: 1,
      stepTitle: 'Visit the website',
      stepDescription: 'Navigate to the website and follow the registration process.',
      estimatedMinutes: 5,
    });
  }
  
  return steps.slice(0, 10); // Max 10 steps
}

async function importWordPressPosts() {
  try {
    console.log('📂 Reading WordPress posts...');
    const postsData = fs.readFileSync('/tmp/wordpress-posts-all.json', 'utf8');
    const posts = JSON.parse(postsData);
    
    console.log(`✅ Found ${posts.length} posts to import\n`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const post of posts) {
      try {
        const title = post.title.rendered;
        const slug = post.slug;
        const content = post.content.rendered;
        const excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '').trim();
        const link = post.link;
        
        // Check if already exists
        const existing = await prisma.backlinkOpportunity.findFirst({
          where: { siteName: title }
        });
        
        if (existing) {
          console.log(`⏭️  Skipping "${title}" - already exists`);
          skipped++;
          continue;
        }
        
        // Extract featured image
        let featuredImageUrl = null;
        if (post._embedded && post._embedded['wp:featuredmedia']) {
          const media = post._embedded['wp:featuredmedia'][0];
          featuredImageUrl = media.source_url;
        }
        
        // Parse steps from content
        const steps = parseStepsFromContent(content);
        
        // Create opportunity
        const opportunity = await prisma.backlinkOpportunity.create({
          data: {
            siteName: title,
            url: link,
            shortDescription: excerpt.substring(0, 200) || `Backlink opportunity at ${title}`,
            fullDescription: content.substring(0, 1000),
            category: 'Directory',
            niche: 'Web Directory',
            language: 'en',
            country: null,
            linkType: 'PROFILE',
            isFree: true,
            cost: null,
            difficultyLevel: 2,
            domainAuthority: null,
            domainRating: null,
            estimatedTraffic: null,
            spamScore: 0,
            referringDomains: null,
            totalBacklinks: null,
            trafficValue: null,
            trustFlow: null,
            citationFlow: null,
            isDofollow: true,
            status: 'ACTIVE',
            instructions: {
              create: steps,
            },
          },
          include: {
            instructions: true,
          },
        });
        
        console.log(`✅ Imported: ${title}`);
        console.log(`   URL: ${link}`);
        console.log(`   Steps: ${steps.length}`);
        if (featuredImageUrl) {
          console.log(`   Image: ${featuredImageUrl}`);
        }
        console.log('');
        
        imported++;
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error importing "${post.title.rendered}":`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total: ${posts.length}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

importWordPressPosts();
