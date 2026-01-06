const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate a clean, short description for an opportunity
function generateCleanDescription(opp) {
  const { siteName, url, shortDescription, domainAuthority, linkType, niche } = opp;
  
  // Extract domain from URL
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = url;
  }
  
  // Determine the type of site for better descriptions
  const nicheText = niche && niche !== 'General' ? `${niche.toLowerCase()} ` : '';
  const daText = domainAuthority ? `DA ${domainAuthority}` : '';
  const linkTypeText = linkType === 'dofollow' ? 'dofollow' : 'nofollow';
  
  // Create different descriptions based on patterns
  let description = '';
  
  // Check if it's a directory/profile site (most WordPress imports are)
  const isDirectory = shortDescription.toLowerCase().includes('create') || 
                      shortDescription.toLowerCase().includes('register') ||
                      shortDescription.toLowerCase().includes('account') ||
                      shortDescription.toLowerCase().includes('profile');
  
  const isGuestPost = shortDescription.toLowerCase().includes('guest post') ||
                      shortDescription.toLowerCase().includes('submit article');
  
  const isForum = shortDescription.toLowerCase().includes('forum') ||
                  shortDescription.toLowerCase().includes('community');
  
  if (isGuestPost) {
    description = `Submit ${nicheText}guest posts on ${siteName}. ${daText ? `${daText}, ` : ''}${linkTypeText} backlinks available.`;
  } else if (isForum) {
    description = `Join ${siteName} ${nicheText}community to build profile backlinks. ${daText ? `${daText}, ` : ''}${linkTypeText} links.`;
  } else if (isDirectory) {
    description = `Create a free profile on ${siteName} to get ${linkTypeText} backlinks. ${daText ? `${daText}.` : ''}`;
  } else {
    // Default description
    description = `Get backlinks from ${siteName} (${domain}). ${daText ? `${daText}, ` : ''}${linkTypeText} link opportunity.`;
  }
  
  // Ensure description is not too long (max 150 chars)
  if (description.length > 150) {
    description = description.substring(0, 147) + '...';
  }
  
  return description.trim();
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
        domainAuthority: true,
        linkType: true,
        niche: true,
      },
    });
    
    console.log(`✅ Found ${opportunities.length} opportunities\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const opp of opportunities) {
      try {
        // Check if description needs cleaning
        // Patterns that indicate raw/messy data
        const needsCleaning = 
          opp.shortDescription.includes('Details Website:') ||
          opp.shortDescription.includes('DA:') ||
          opp.shortDescription.includes('Instructions Go to') ||
          opp.shortDescription.includes('Click on the link') ||
          opp.shortDescription.length > 150;
        
        if (!needsCleaning) {
          skipped++;
          continue;
        }
        
        // Generate clean description
        const cleanDesc = generateCleanDescription(opp);
        
        // Update the opportunity
        await prisma.backlinkOpportunity.update({
          where: { id: opp.id },
          data: { shortDescription: cleanDesc },
        });
        
        console.log(`✅ Updated: ${opp.siteName}`);
        console.log(`   Before: ${opp.shortDescription.substring(0, 80)}...`);
        console.log(`   After:  ${cleanDesc}`);
        console.log('');
        
        updated++;
      } catch (err) {
        console.error(`❌ Error updating ${opp.siteName}:`, err.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Total: ${opportunities.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (already clean): ${skipped}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllDescriptions();
