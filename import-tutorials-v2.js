const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WP_BASE_URL = 'https://rankdseo.com/wp-json/wp/v2';
const WP_AUTH = Buffer.from('toms@uprankd.com:uIaB e14e ymbA 9Vqu C9L0 M2Rw').toString('base64');

// Parse HTML content to extract instructions with images
function parseInstructions(htmlContent) {
  const instructions = [];
  
  // Find the Instructions section
  const instructionsMatch = htmlContent.match(/<h2[^>]*>Instructions<\/h2>([\s\S]*?)(?:<h2|$)/i);
  if (!instructionsMatch) return instructions;
  
  const instructionsHtml = instructionsMatch[1];
  
  // Split by image tags to create steps
  const imgRegex = /<img[^>]*src="([^"]+)"[^>]*>/gi;
  const textParts = instructionsHtml.split(imgRegex);
  
  let stepOrder = 1;
  let currentDescription = '';
  
  // Process alternating text and image URLs
  for (let i = 0; i < textParts.length; i++) {
    const part = textParts[i];
    
    // Check if this is an image URL (from capture group)
    if (part && part.startsWith('http') && (part.includes('.jpg') || part.includes('.png') || part.includes('.gif') || part.includes('.webp'))) {
      // This is a screenshot URL
      const description = currentDescription
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8217;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (description || part) {
        instructions.push({
          stepOrder: stepOrder++,
          stepTitle: `Step ${stepOrder - 1}`,
          stepDescription: description || `Follow the screenshot below`,
          screenshotUrl: part
        });
      }
      currentDescription = '';
    } else {
      // This is text content
      currentDescription += part;
    }
  }
  
  // Add any remaining text as a final step without screenshot
  if (currentDescription.trim()) {
    const description = currentDescription
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (description && instructions.length === 0) {
      instructions.push({
        stepOrder: 1,
        stepTitle: 'Instructions',
        stepDescription: description,
        screenshotUrl: null
      });
    }
  }
  
  return instructions;
}

// Extract details from content
function extractDetails(htmlContent) {
  const details = {};
  
  const websiteMatch = htmlContent.match(/<strong>Website<\/strong>:\s*<a[^>]*href="([^"]+)"[^>]*>/i);
  if (websiteMatch) details.url = websiteMatch[1];
  
  const daMatch = htmlContent.match(/<strong>DA<\/strong>:\s*(\d+)/i);
  if (daMatch) details.domainAuthority = parseInt(daMatch[1]);
  
  const paMatch = htmlContent.match(/<strong>PA<\/strong>:\s*(\d+)/i);
  if (paMatch) details.pageAuthority = parseInt(paMatch[1]);
  
  const doFollowMatch = htmlContent.match(/<strong>Do-Follow<\/strong>:\s*(YES|NO)/i);
  if (doFollowMatch) details.isDofollow = doFollowMatch[1].toUpperCase() === 'YES';
  
  return details;
}

// Fetch posts with retry logic
async function fetchPosts(startPage = 1, maxPages = 5) {
  const allPosts = [];
  let page = startPage;
  let consecutiveErrors = 0;
  
  while (page < startPage + maxPages && consecutiveErrors < 3) {
    try {
      const url = `${WP_BASE_URL}/posts?per_page=100&page=${page}`;
      console.log(`   Fetching page ${page}...`);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Basic ${WP_AUTH}` }
      });
      
      if (!response.ok) {
        if (response.status === 400) break;
        throw new Error(`HTTP ${response.status}`);
      }
      
      const posts = await response.json();
      if (posts.length === 0) break;
      
      allPosts.push(...posts);
      console.log(`   ✅ Got ${posts.length} posts (total: ${allPosts.length})`);
      consecutiveErrors = 0;
      
      page++;
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`   ⚠️ Error on page ${page}: ${error.message}, retrying...`);
      consecutiveErrors++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return allPosts;
}

// Main function
async function importTutorials() {
  try {
    console.log('📥 Fetching WordPress posts...\n');
    const posts = await fetchPosts(1, 15); // Fetch up to 15 pages
    console.log(`\n✅ Total posts fetched: ${posts.length}\n`);
    
    let updated = 0;
    let instructionsAdded = 0;
    let notFound = 0;
    
    console.log('📝 Processing posts and adding tutorials...\n');
    
    for (const post of posts) {
      try {
        const title = post.title.rendered
          .replace(/&#8211;/g, '-')
          .replace(/&#8217;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/<[^>]*>/g, '')
          .trim();
        
        // Find the opportunity by name (case insensitive)
        const opportunity = await prisma.backlinkOpportunity.findFirst({
          where: { siteName: { equals: title, mode: 'insensitive' } },
          include: { instructions: true }
        });
        
        if (!opportunity) {
          notFound++;
          continue;
        }
        
        // Skip if already has instructions
        if (opportunity.instructions.length > 0) {
          continue;
        }
        
        const content = post.content.rendered || '';
        
        // Extract details
        const details = extractDetails(content);
        
        // Parse instructions
        const instructions = parseInstructions(content);
        
        if (instructions.length === 0) continue;
        
        // Update opportunity with better data
        const updateData = {};
        if (details.url && !details.url.includes('rankdseo.com')) {
          updateData.url = details.url;
          
          // Update short description
          let domain = '';
          try { domain = new URL(details.url).hostname.replace('www.', ''); } catch {}
          const linkType = details.isDofollow !== false ? 'dofollow' : 'nofollow';
          const daText = details.domainAuthority ? `DA ${details.domainAuthority}` : '';
          updateData.shortDescription = `Create a free profile on ${title}${domain ? ` (${domain})` : ''} for ${linkType} backlinks.${daText ? ` ${daText}.` : ''}`;
          
          // Update full description
          updateData.fullDescription = `## About ${title}

${title} is a platform where you can create a profile and add your website link to build quality backlinks.

**Domain Authority (DA):** ${details.domainAuthority || 'N/A'}
**Page Authority (PA):** ${details.pageAuthority || 'N/A'}
**Link Type:** ${details.isDofollow !== false ? 'Dofollow' : 'Nofollow'}

**Website:** ${details.url}

## Quick Overview

This opportunity allows you to create a free profile and include your website URL to gain a valuable backlink. Follow the step-by-step tutorial below with screenshots to complete the process.`;
        }
        
        if (details.domainAuthority) updateData.domainAuthority = details.domainAuthority;
        if (details.pageAuthority) updateData.pageAuthority = details.pageAuthority;
        if (details.isDofollow !== undefined) updateData.isDofollow = details.isDofollow;
        
        if (Object.keys(updateData).length > 0) {
          await prisma.backlinkOpportunity.update({
            where: { id: opportunity.id },
            data: updateData
          });
        }
        
        // Create instruction records
        for (const instruction of instructions) {
          await prisma.opportunityInstruction.create({
            data: {
              opportunityId: opportunity.id,
              stepOrder: instruction.stepOrder,
              stepTitle: instruction.stepTitle,
              stepDescription: instruction.stepDescription,
              screenshotUrl: instruction.screenshotUrl
            }
          });
          instructionsAdded++;
        }
        
        updated++;
        if (updated % 25 === 0) {
          console.log(`   ✅ Updated ${updated} opportunities (${instructionsAdded} steps)...`);
        }
        
      } catch (err) {
        console.error(`   Error processing: ${err.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   WordPress posts processed: ${posts.length}`);
    console.log(`   Opportunities updated with tutorials: ${updated}`);
    console.log(`   Instruction steps added: ${instructionsAdded}`);
    console.log(`   Not found in DB: ${notFound}`);
    console.log('='.repeat(60));
    
    const totalInstructions = await prisma.opportunityInstruction.count();
    console.log(`\n✅ Total instructions in database: ${totalInstructions}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importTutorials();
