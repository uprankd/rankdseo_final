const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Better HTML to text parser
function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Extract images from HTML
function extractImages(html) {
  const images = [];
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    images.push(match[1]);
  }
  return images;
}

// Parse proper tutorial steps from WordPress content
function parseTutorialSteps(content, title) {
  const steps = [];
  const cleanText = htmlToText(content);
  const images = extractImages(content);
  
  // Try to split by numbered steps (1., 2., 3., etc.)
  const stepPattern = /(\d+)\.\s*([^\n]+)/g;
  let match;
  const foundSteps = [];
  
  while ((match = stepPattern.exec(cleanText)) !== null) {
    const stepNum = parseInt(match[1]);
    const stepText = match[2].trim();
    if (stepText.length > 5) {
      foundSteps.push({
        number: stepNum,
        text: stepText
      });
    }
  }
  
  // If we found numbered steps, use them
  if (foundSteps.length > 0) {
    foundSteps.forEach((step, index) => {
      steps.push({
        stepOrder: step.number,
        stepTitle: step.text.substring(0, 100),
        stepDescription: step.text.substring(0, 500),
        imageUrl: images[index] || null,
        estimatedMinutes: 2,
      });
    });
  } else {
    // Fallback: Split by paragraphs or lines
    const lines = cleanText.split('\n').filter(line => {
      const cleaned = line.trim();
      return cleaned.length > 20 && cleaned.length < 500;
    });
    
    lines.slice(0, 10).forEach((line, index) => {
      steps.push({
        stepOrder: index + 1,
        stepTitle: line.substring(0, 100),
        stepDescription: line,
        imageUrl: images[index] || null,
        estimatedMinutes: 2,
      });
    });
  }
  
  // If still no steps, create default ones
  if (steps.length === 0) {
    steps.push({
      stepOrder: 1,
      stepTitle: `Visit ${title}`,
      stepDescription: `Navigate to the ${title} website and look for the registration or sign-up option.`,
      imageUrl: images[0] || null,
      estimatedMinutes: 1,
    });
    steps.push({
      stepOrder: 2,
      stepTitle: 'Create an account',
      stepDescription: 'Fill in the registration form with your details (email, password, etc.) and submit.',
      imageUrl: images[1] || null,
      estimatedMinutes: 3,
    });
    steps.push({
      stepOrder: 3,
      stepTitle: 'Add your backlink',
      stepDescription: 'Once logged in, find the profile or listing section and add your website URL and description.',
      imageUrl: images[2] || null,
      estimatedMinutes: 3,
    });
    steps.push({
      stepOrder: 4,
      stepTitle: 'Publish and verify',
      stepDescription: 'Save/publish your profile and verify that your backlink is live on the site.',
      imageUrl: images[3] || null,
      estimatedMinutes: 1,
    });
  }
  
  return steps;
}

async function updateOpportunitiesWithProperSteps() {
  try {
    console.log('📂 Reading WordPress posts...');
    const postsData = fs.readFileSync('/tmp/wordpress-posts-all.json', 'utf8');
    const posts = JSON.parse(postsData);
    
    console.log(`✅ Found ${posts.length} posts\n`);
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    
    for (const post of posts) {
      try {
        const title = post.title.rendered;
        const content = post.content.rendered;
        
        // Find existing opportunity
        const opportunity = await prisma.backlinkOpportunity.findFirst({
          where: { siteName: title },
          include: { instructions: true }
        });
        
        if (!opportunity) {
          console.log(`⏭️  Not found: ${title}`);
          notFound++;
          continue;
        }
        
        // Parse proper steps
        const newSteps = parseTutorialSteps(content, title);
        
        if (newSteps.length === 0) {
          console.log(`⚠️  No steps parsed for: ${title}`);
          continue;
        }
        
        // Delete old instructions
        await prisma.opportunityInstruction.deleteMany({
          where: { opportunityId: opportunity.id }
        });
        
        // Create new instructions
        await prisma.opportunityInstruction.createMany({
          data: newSteps.map(step => ({
            ...step,
            opportunityId: opportunity.id,
          }))
        });
        
        console.log(`✅ Updated: ${title}`);
        console.log(`   Steps: ${newSteps.length}`);
        newSteps.forEach((step, i) => {
          console.log(`   ${step.stepOrder}. ${step.stepTitle.substring(0, 60)}...`);
        });
        console.log('');
        
        updated++;
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error updating "${post.title.rendered}":`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Not Found: ${notFound}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total: ${posts.length}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateOpportunitiesWithProperSteps();
