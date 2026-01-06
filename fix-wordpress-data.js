const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Extract data from WordPress imported HTML content
function extractDataFromHtml(html) {
  const data = {};
  
  // Extract website URL
  const websiteMatch = html.match(/<strong>Website<\/strong>:\s*<a[^>]*href="([^"]+)"[^>]*>/i);
  if (websiteMatch) {
    data.url = websiteMatch[1];
  }
  
  // Extract DA
  const daMatch = html.match(/<strong>DA<\/strong>:\s*(\d+)/i);
  if (daMatch) {
    data.domainAuthority = parseInt(daMatch[1]);
  }
  
  // Extract Do-Follow status
  const doFollowMatch = html.match(/<strong>Do-Follow<\/strong>:\s*(YES|NO)/i);
  if (doFollowMatch) {
    data.linkType = doFollowMatch[1].toUpperCase() === 'YES' ? 'dofollow' : 'nofollow';
  }
  
  return data;
}

// Generate a clean, informative description
function generateDescription(siteName, url, da, linkType) {
  // Get domain from URL
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = url;
  }
  
  const daText = da ? `DA ${da}` : '';
  const linkText = linkType === 'dofollow' ? 'dofollow' : 'nofollow';
  
  // Create a short, informative description
  const descriptions = [
    `Create a free profile on ${siteName} (${domain}) for ${linkText} backlinks.${daText ? ` ${daText}.` : ''}`,
    `Get a ${linkText} backlink from ${siteName}.${daText ? ` ${daText}.` : ''} Free profile creation available.`,
    `Build backlinks on ${siteName} (${domain}).${daText ? ` ${daText},` : ''} ${linkText} links via profile.`,
  ];
  
  // Pick a description based on site name hash for variety
  const index = siteName.length % descriptions.length;
  let desc = descriptions[index];
  
  // Ensure it's not too long
  if (desc.length > 150) {
    desc = desc.substring(0, 147) + '...';
  }
  
  return desc;
}

async function fixWordPressImports() {
  try {
    console.log('🔍 Finding WordPress imported opportunities...\n');
    
    // Get all opportunities with rankdseo.com URLs (WordPress imports)
    const opportunities = await prisma.backlinkOpportunity.findMany({
      where: {
        url: {
          contains: 'rankdseo.com'
        }
      },
      select: {
        id: true,
        siteName: true,
        url: true,
        fullDescription: true,
        domainAuthority: true,
        linkType: true,
      },
    });
    
    console.log(`✅ Found ${opportunities.length} WordPress imported opportunities\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const opp of opportunities) {
      try {
        // Extract data from fullDescription HTML
        const extracted = extractDataFromHtml(opp.fullDescription || '');
        
        if (!extracted.url) {
          console.log(`⏭️  Skipping "${opp.siteName}" - no URL found in description`);
          skipped++;
          continue;
        }
        
        // Generate clean description
        const cleanDesc = generateDescription(
          opp.siteName,
          extracted.url,
          extracted.domainAuthority,
          extracted.linkType || 'dofollow'
        );
        
        // Update the opportunity
        await prisma.backlinkOpportunity.update({
          where: { id: opp.id },
          data: {
            url: extracted.url,
            domainAuthority: extracted.domainAuthority || null,
            linkType: extracted.linkType === 'dofollow' ? 'DOFOLLOW' : extracted.linkType === 'nofollow' ? 'NOFOLLOW' : 'PROFILE',
            shortDescription: cleanDesc,
          },
        });
        
        console.log(`✅ Updated: ${opp.siteName}`);
        console.log(`   URL: ${extracted.url}`);
        console.log(`   DA: ${extracted.domainAuthority || 'N/A'}`);
        console.log(`   Link Type: ${extracted.linkType || 'N/A'}`);
        console.log(`   Description: ${cleanDesc}`);
        console.log('');
        
        updated++;
      } catch (err) {
        console.error(`❌ Error updating ${opp.siteName}:`, err.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Total WordPress imports: ${opportunities.length}`);
    console.log(`   Successfully updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWordPressImports();
