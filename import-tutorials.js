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
  
  // Split by paragraphs and images
  const parts = instructionsHtml.split(/<\/p>|<br\s*\/?>/i).filter(p => p.trim());
  
  let currentStep = {
    stepOrder: 1,
    stepTitle: '',
    stepDescription: '',
    screenshotUrl: null
  };
  
  for (const part of parts) {
    // Check for image
    const imgMatch = part.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
    if (imgMatch) {
      // Save current step if it has content
      if (currentStep.stepDescription || currentStep.screenshotUrl) {
        if (!currentStep.stepTitle) {
          currentStep.stepTitle = `Step ${currentStep.stepOrder}`;
        }
        instructions.push({ ...currentStep });
        currentStep = {
          stepOrder: currentStep.stepOrder + 1,
          stepTitle: '',
          stepDescription: '',
          screenshotUrl: null
        };
      }
      currentStep.screenshotUrl = imgMatch[1];
    }
    
    // Extract text content
    const textContent = part
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&amp;/g, '&')
      .trim();
    
    if (textContent && !textContent.startsWith('Go to http')) {
      if (currentStep.stepDescription) {
        currentStep.stepDescription += ' ' + textContent;
      } else {
        currentStep.stepDescription = textContent;
      }
    } else if (textContent.startsWith('Go to')) {
      currentStep.stepDescription = textContent;
    }
  }
  
  // Add last step if has content
  if (currentStep.stepDescription || currentStep.screenshotUrl) {
    if (!currentStep.stepTitle) {
      currentStep.stepTitle = `Step ${currentStep.stepOrder}`;
    }
    instructions.push(currentStep);
  }
  
  return instructions;
}

// Extract details from content
function extractDetails(htmlContent) {
  const details = {};
  
  // Website URL
  const websiteMatch = htmlContent.match(/<strong>Website<\/strong>:\s*<a[^>]*href="([^"]+)"[^>]*>/i);
  if (websiteMatch) details.url = websiteMatch[1];
  
  // DA
  const daMatch = htmlContent.match(/<strong>DA<\/strong>:\s*(\d+)/i);
  if (daMatch) details.domainAuthority = parseInt(daMatch[1]);
  
  // PA
  const paMatch = htmlContent.match(/<strong>PA<\/strong>:\s*(\d+)/i);
  if (paMatch) details.pageAuthority = parseInt(paMatch[1]);
  
  // DoFollow
  const doFollowMatch = htmlContent.match(/<strong>Do-Follow<\/strong>:\s*(YES|NO)/i);
  if (doFollowMatch) details.isDofollow = doFollowMatch[1].toUpperCase() === 'YES';
  
  return details;
}

// Fetch all WordPress posts with full content
async function fetchAllPosts() {
  const allPosts = [];
  let page = 1;
  const perPage = 100;
  
  console.log('📥 Fetching WordPress posts with full content...\n');
  
  while (true) {
    try {
      const url = `${WP_BASE_URL}/posts?per_page=${perPage}&page=${page}`;
      console.log(`   Fetching page ${page}...`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${WP_AUTH}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 400) break;
        throw new Error(`HTTP ${response.status}`);
      }
      
      const posts = await response.json();
      if (posts.length === 0) break;
      
      allPosts.push(...posts);
      console.log(`   ✅ Got ${posts.length} posts (total: ${allPosts.length})`);
      
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      if (page >= totalPages) break;
      
      page++;
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      break;
    }
  }
  
  console.log(`\n✅ Total posts fetched: ${allPosts.length}\n`);
  return allPosts;
}

// Generate better full description with extracted data
function generateFullDescription(siteName, url, da, pa, isDofollow) {
  const linkType = isDofollow ? 'dofollow' : 'nofollow';
  
  return `## About ${siteName}

${siteName} is a platform where you can create a profile and add your website link to build quality backlinks.

**Domain Authority (DA):** ${da || 'N/A'}
**Page Authority (PA):** ${pa || 'N/A'}
**Link Type:** ${linkType}

**Website:** ${url}

## Quick Overview

This opportunity allows you to create a free profile and include your website URL to gain a valuable ${linkType} backlink. Follow the step-by-step tutorial below with screenshots to complete the process.`;
}

// Main function
async function importTutorials() {
  try {
    // Get all opportunities without instructions
    const opportunities = await prisma.backlinkOpportunity.findMany({
      where: {
        instructions: { none: {} }
      },
      select: { id: true, siteName: true }
    });
    
    console.log(`📊 Found ${opportunities.length} opportunities without tutorials\n`);
    
    // Create a map for quick lookup
    const oppMap = new Map();
    opportunities.forEach(opp => {
      oppMap.set(opp.siteName.toLowerCase().trim(), opp.id);
    });
    
    // Fetch all WordPress posts
    const posts = await fetchAllPosts();
    
    let updated = 0;
    let instructionsAdded = 0;
    
    console.log('📝 Processing posts and adding tutorials...\n');
    
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
        
        // Extract details
        const details = extractDetails(content);
        
        // Parse instructions
        const instructions = parseInstructions(content);
        
        if (instructions.length === 0) continue;
        
        // Update opportunity with better data
        const updateData = {};
        if (details.url && !details.url.includes('rankdseo.com')) {
          updateData.url = details.url;
        }
        if (details.domainAuthority) {
          updateData.domainAuthority = details.domainAuthority;
        }
        if (details.pageAuthority) {
          updateData.pageAuthority = details.pageAuthority;
        }
        if (details.isDofollow !== undefined) {
          updateData.isDofollow = details.isDofollow;
        }
        
        // Generate better description
        if (details.url) {
          updateData.fullDescription = generateFullDescription(
            title,
            details.url,
            details.domainAuthority,
            details.pageAuthority,
            details.isDofollow
          );
          
          // Also update short description
          const linkType = details.isDofollow ? 'dofollow' : 'nofollow';
          const daText = details.domainAuthority ? `DA ${details.domainAuthority}` : '';
          updateData.shortDescription = `Create a free profile on ${title} for ${linkType} backlinks.${daText ? ` ${daText}.` : ''}`;
        }
        
        if (Object.keys(updateData).length > 0) {
          await prisma.backlinkOpportunity.update({
            where: { id: oppId },
            data: updateData
          });
        }
        
        // Create instruction records
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
        if (updated % 50 === 0) {
          console.log(`   ✅ Updated ${updated} opportunities (${instructionsAdded} instruction steps)...`);
        }
        
      } catch (err) {
        // Skip errors silently
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Opportunities updated: ${updated}`);
    console.log(`   Instruction steps added: ${instructionsAdded}`);
    console.log('='.repeat(60));
    
    // Final count
    const totalInstructions = await prisma.opportunityInstruction.count();
    console.log(`\n✅ Total instructions in database: ${totalInstructions}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importTutorials();
