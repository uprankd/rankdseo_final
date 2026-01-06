const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Convert HTML to clean text and extract useful info
function cleanHtmlToText(html) {
  if (!html) return '';
  
  // Remove HTML tags but preserve some structure
  let text = html
    // Remove script and style tags completely
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Replace br and p tags with newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/  +/g, ' ')
    .trim();
  
  return text;
}

// Generate a beautiful formatted description from raw content
function generateBeautifulDescription(siteName, url, rawContent, da) {
  // Clean the raw HTML content
  const cleanedContent = cleanHtmlToText(rawContent);
  
  // Extract domain for display
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = url;
  }
  
  // Parse instructions from the cleaned content
  let instructions = '';
  const instructionsMatch = cleanedContent.match(/Instructions([\s\S]*?)(?:$)/i);
  if (instructionsMatch) {
    instructions = instructionsMatch[1].trim();
    // Clean up the instructions
    instructions = instructions
      .replace(/Go to\s+https?:\/\/[^\s]+/gi, (match) => match.replace(/https?:\/\/[^\s]+/, 'the website'))
      .replace(/Click on the link to create a new account/gi, 'Click the registration link')
      .replace(/Enter details and click the register button/gi, 'Fill in your details and register')
      .trim();
  }
  
  // Build a nice description
  let description = `## About ${siteName}\n\n`;
  description += `${siteName} is a platform where you can create a profile and add your website link to build backlinks.\n\n`;
  
  if (da) {
    description += `**Domain Authority (DA):** ${da}\n\n`;
  }
  
  description += `**Website:** ${url}\n\n`;
  
  // Add instructions section
  description += `## How to Get Your Backlink\n\n`;
  description += `1. Visit ${domain}\n`;
  description += `2. Click on the registration or sign-up link\n`;
  description += `3. Create your free account with your details\n`;
  description += `4. Complete your profile and add your website URL\n`;
  description += `5. Save your profile to secure your backlink\n\n`;
  
  description += `## Tips for Success\n\n`;
  description += `- Use a professional profile photo\n`;
  description += `- Write a compelling bio that includes your keywords\n`;
  description += `- Add your website link in the designated field\n`;
  description += `- Complete all available profile fields for better visibility\n`;
  
  return description;
}

async function cleanAllFullDescriptions() {
  try {
    console.log('🔍 Finding opportunities with HTML in fullDescription...\n');
    
    const opportunities = await prisma.backlinkOpportunity.findMany({
      where: {
        fullDescription: { contains: '<' }
      },
      select: {
        id: true,
        siteName: true,
        url: true,
        fullDescription: true,
        domainAuthority: true,
      },
    });
    
    console.log(`✅ Found ${opportunities.length} opportunities to clean\n`);
    
    let updated = 0;
    
    for (const opp of opportunities) {
      try {
        const cleanDesc = generateBeautifulDescription(
          opp.siteName,
          opp.url,
          opp.fullDescription,
          opp.domainAuthority
        );
        
        await prisma.backlinkOpportunity.update({
          where: { id: opp.id },
          data: { fullDescription: cleanDesc },
        });
        
        console.log(`✅ Cleaned: ${opp.siteName}`);
        updated++;
      } catch (err) {
        console.error(`❌ Error cleaning ${opp.siteName}:`, err.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary: Updated ${updated} of ${opportunities.length} opportunities`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllFullDescriptions();
