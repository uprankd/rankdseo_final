const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Better HTML to text parser
function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/h[1-6]>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate a clean, informative description
function generateCleanDescription(siteName, url, fullDescription) {
  // Clean the full description
  const cleaned = htmlToText(fullDescription);
  
  // Extract key information
  let description = '';
  
  // Try to find meaningful content
  const sentences = cleaned.split('.').filter(s => s.trim().length > 20);
  
  if (sentences.length > 0) {
    // Take first 1-2 sentences
    description = sentences.slice(0, 2).join('. ').trim();
    if (description && !description.endsWith('.')) {
      description += '.';
    }
  }
  
  // If no good content, create generic description
  if (!description || description.length < 30) {
    const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    description = `Create a profile backlink on ${siteName} (${domain}). Follow the step-by-step tutorial to register and add your website link.`;
  }
  
  // Limit to 200 characters for short description
  if (description.length > 200) {
    description = description.substring(0, 197) + '...';
  }
  
  return description;
}

async function cleanAllDescriptions() {
  try {
    console.log('📂 Fetching all opportunities...\n');
    
    const opportunities = await prisma.backlinkOpportunity.findMany({
      select: {
        id: true,
        siteName: true,
        url: true,
        shortDescription: true,
        fullDescription: true,
      },
    });
    
    console.log(`✅ Found ${opportunities.length} opportunities\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const opp of opportunities) {
      try {
        // Check if description needs cleaning (contains HTML tags)
        const needsCleaning = 
          opp.shortDescription.includes('<') || 
          opp.shortDescription.includes('&') ||
          opp.shortDescription.length > 250;
        
        if (!needsCleaning) {
          console.log(`⏭️  Skipping "${opp.siteName}" - already clean`);
          skipped++;
          continue;
        }
        
        // Generate clean description
        const cleanShort = generateCleanDescription(
          opp.siteName,
          opp.url,
          opp.fullDescription || opp.shortDescription
        );
        
        const cleanFull = htmlToText(opp.fullDescription || opp.shortDescription);
        
        // Update the opportunity
        await prisma.backlinkOpportunity.update({
          where: { id: opp.id },
          data: {
            shortDescription: cleanShort,
            fullDescription: cleanFull.substring(0, 1000),
          },
        });
        
        console.log(`✅ Cleaned: ${opp.siteName}`);
        console.log(`   Before: ${opp.shortDescription.substring(0, 100)}...`);
        console.log(`   After:  ${cleanShort}`);
        console.log('');
        
        updated++;
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Error cleaning "${opp.siteName}":`, error.message);
      }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${opportunities.length}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

cleanAllDescriptions();
