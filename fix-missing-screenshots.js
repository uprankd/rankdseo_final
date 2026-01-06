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
  
  for (let i = 0; i < textParts.length; i++) {
    const part = textParts[i];
    
    if (part && part.startsWith('http') && (part.includes('.jpg') || part.includes('.png') || part.includes('.gif') || part.includes('.webp'))) {
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
      currentDescription += part;
    }
  }
  
  // Add remaining text as final step
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
  
  const doFollowMatch = htmlContent.match(/<strong>Do-Follow<\/strong>:\s*(YES|NO)/i);
  if (doFollowMatch) details.isDofollow = doFollowMatch[1].toUpperCase() === 'YES';
  
  return details;
}

// Fetch posts with retry logic
async function fetchPosts(startPage = 1, maxPages = 15) {
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

async function fixMissingScreenshots() {
  try {
    // Get opportunities that have instructions but all without screenshots
    const oppsToFix = await prisma.backlinkOpportunity.findMany({
      where: {
        instructions: {
          some: {},
          every: { screenshotUrl: null }
        }
      },
      select: { id: true, siteName: true }
    });
    
    // Also get opportunities with no instructions at all
    const oppsNoInstructions = await prisma.backlinkOpportunity.findMany({
      where: { instructions: { none: {} } },
      select: { id: true, siteName: true }
    });
    
    const allOppsToFix = [...oppsToFix, ...oppsNoInstructions];
    console.log(`📊 Found ${allOppsToFix.length} opportunities needing screenshots\n`);
    
    // Create lookup map
    const oppMap = new Map();
    allOppsToFix.forEach(opp => {
      oppMap.set(opp.siteName.toLowerCase().trim(), opp.id);
    });
    
    console.log('📥 Fetching WordPress posts...\n');
    const posts = await fetchPosts(1, 15);
    console.log(`\n✅ Total posts fetched: ${posts.length}\n`);
    
    let updated = 0;
    let instructionsAdded = 0;
    
    console.log('📝 Processing posts and updating tutorials...\n');
    
    for (const post of posts) {
      try {
        const title = post.title.rendered
          .replace(/&#8211;/g, '-')
          .replace(/&#8217;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/<[^>]*>/g, '')
          .trim();
        
        const oppId = oppMap.get(title.toLowerCase().trim());
        if (!oppId) continue;
        
        const content = post.content.rendered || '';
        const instructions = parseInstructions(content);
        
        // Only update if we found instructions with screenshots
        const hasScreenshots = instructions.some(i => i.screenshotUrl);
        if (!hasScreenshots) continue;
        
        // Delete existing instructions (the ones without screenshots)
        await prisma.opportunityInstruction.deleteMany({
          where: { opportunityId: oppId }
        });
        
        // Extract details and update opportunity
        const details = extractDetails(content);
        if (details.url && !details.url.includes('rankdseo.com')) {
          let domain = '';
          try { domain = new URL(details.url).hostname.replace('www.', ''); } catch {}
          const linkType = details.isDofollow !== false ? 'dofollow' : 'nofollow';
          const daText = details.domainAuthority ? `DA ${details.domainAuthority}` : '';
          
          await prisma.backlinkOpportunity.update({
            where: { id: oppId },
            data: {
              url: details.url,
              domainAuthority: details.domainAuthority || undefined,
              isDofollow: details.isDofollow,
              shortDescription: `Create a free profile on ${title}${domain ? ` (${domain})` : ''} for ${linkType} backlinks.${daText ? ` ${daText}.` : ''}`,
              fullDescription: `## About ${title}

${title} is a platform where you can create a profile and add your website link to build quality backlinks.

**Domain Authority (DA):** ${details.domainAuthority || 'N/A'}
**Link Type:** ${details.isDofollow !== false ? 'Dofollow' : 'Nofollow'}

**Website:** ${details.url}

## Quick Overview

This opportunity allows you to create a free profile and include your website URL to gain a valuable backlink. Follow the step-by-step tutorial below with screenshots to complete the process.`
            }
          });
        }
        
        // Create new instructions with screenshots
        for (const instruction of instructions) {
          await prisma.opportunityInstruction.create({
            data: {
              opportunityId: oppId,
              stepOrder: instruction.stepOrder,
              stepTitle: instruction.stepTitle,
              stepDescription: instruction.stepDescription,
              screenshotUrl: instruction.screenshotUrl
            }
          });
          instructionsAdded++;
        }
        
        updated++;
        console.log(`✅ Fixed: ${title} (${instructions.length} steps with screenshots)`);
        
        // Remove from map so we don't process again
        oppMap.delete(title.toLowerCase().trim());
        
      } catch (err) {
        // Skip errors
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Opportunities fixed: ${updated}`);
    console.log(`   Instruction steps added: ${instructionsAdded}`);
    console.log(`   Still missing (not in WordPress): ${oppMap.size}`);
    console.log('='.repeat(60));
    
    // List remaining opportunities not found in WordPress
    if (oppMap.size > 0) {
      console.log('\nOpportunities not found in WordPress:');
      for (const [name, id] of oppMap) {
        console.log(` - ${name}`);
      }
    }
    
    // Final counts
    const totalWithScreenshots = await prisma.opportunityInstruction.count({
      where: { screenshotUrl: { not: null } }
    });
    console.log(`\n✅ Total instructions with screenshots: ${totalWithScreenshots}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingScreenshots();
