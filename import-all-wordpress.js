const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// WordPress API credentials
const WP_BASE_URL = 'https://rankdseo.com/wp-json/wp/v2';
const WP_USERNAME = 'forrankdseo';
const WP_APP_PASSWORD = 'rcDy xLne gXyU uu2J uJD3 FqVk';

// Create auth header
const authHeader = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// Fetch posts from WordPress with pagination
async function fetchAllPosts() {
  const allPosts = [];
  let page = 1;
  const perPage = 100; // Max allowed by WP API
  
  console.log('📥 Fetching all posts from WordPress...\n');
  
  while (true) {
    try {
      const url = `${WP_BASE_URL}/posts?per_page=${perPage}&page=${page}`;
      console.log(`   Fetching page ${page}...`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 400) {
          // No more pages
          break;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const posts = await response.json();
      
      if (posts.length === 0) {
        break;
      }
      
      allPosts.push(...posts);
      console.log(`   ✅ Got ${posts.length} posts (total: ${allPosts.length})`);
      
      // Check if we've reached the last page
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      if (page >= totalPages) {
        break;
      }
      
      page++;
      
      // Small delay to be nice to the server
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`   ❌ Error fetching page ${page}:`, error.message);
      break;
    }
  }
  
  console.log(`\n✅ Total posts fetched: ${allPosts.length}\n`);
  return allPosts;
}

// Extract data from WordPress post HTML content
function extractDataFromContent(htmlContent) {
  const data = {};
  
  // Extract website URL
  const websiteMatch = htmlContent.match(/<strong>Website<\/strong>:\s*<a[^>]*href="([^"]+)"[^>]*>/i) ||
                       htmlContent.match(/Website:\s*<a[^>]*href="([^"]+)"[^>]*>/i) ||
                       htmlContent.match(/href="(https?:\/\/[^"]+)"[^>]*>[^<]*<\/a>/i);
  if (websiteMatch) {
    data.url = websiteMatch[1];
  }
  
  // Extract DA
  const daMatch = htmlContent.match(/<strong>DA<\/strong>:\s*(\d+)/i) ||
                  htmlContent.match(/DA:\s*(\d+)/i);
  if (daMatch) {
    data.domainAuthority = parseInt(daMatch[1]);
  }
  
  // Extract PA
  const paMatch = htmlContent.match(/<strong>PA<\/strong>:\s*(\d+)/i) ||
                  htmlContent.match(/PA:\s*(\d+)/i);
  if (paMatch) {
    data.pageAuthority = parseInt(paMatch[1]);
  }
  
  // Extract Do-Follow status
  const doFollowMatch = htmlContent.match(/<strong>Do-Follow<\/strong>:\s*(YES|NO)/i) ||
                        htmlContent.match(/Do-Follow:\s*(YES|NO)/i);
  if (doFollowMatch) {
    data.isDofollow = doFollowMatch[1].toUpperCase() === 'YES';
  }
  
  return data;
}

// Clean HTML and generate a nice description
function generateDescription(siteName, url, da, isDofollow) {
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = siteName.toLowerCase().replace(/\s+/g, '');
  }
  
  const linkText = isDofollow !== false ? 'dofollow' : 'nofollow';
  const daText = da ? `DA ${da}` : '';
  
  const templates = [
    `Create a free profile on ${siteName} (${domain}) for ${linkText} backlinks.${daText ? ` ${daText}.` : ''}`,
    `Get a ${linkText} backlink from ${siteName}.${daText ? ` ${daText}.` : ''} Free profile creation available.`,
    `Build backlinks on ${siteName} (${domain}).${daText ? ` ${daText},` : ''} ${linkText} links via profile.`,
  ];
  
  const index = siteName.length % templates.length;
  let desc = templates[index];
  
  if (desc.length > 150) {
    desc = desc.substring(0, 147) + '...';
  }
  
  return desc;
}

// Generate full description in Markdown
function generateFullDescription(siteName, url, da) {
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = siteName.toLowerCase();
  }
  
  return `## About ${siteName}

${siteName} is a platform where you can create a profile and add your website link to build backlinks.

**Domain Authority (DA):** ${da || 'N/A'}

**Website:** ${url}

## How to Get Your Backlink

1. Visit ${domain}
2. Click on the registration or sign-up link
3. Create your free account with your details
4. Complete your profile and add your website URL
5. Save your profile to secure your backlink

## Tips for Success

- Use a professional profile photo
- Write a compelling bio that includes your keywords
- Add your website link in the designated field
- Complete all available profile fields for better visibility`;
}

// Main import function
async function importAllPosts() {
  try {
    // Get existing site names to avoid duplicates
    const existingOpps = await prisma.backlinkOpportunity.findMany({
      select: { siteName: true }
    });
    const existingSiteNames = new Set(existingOpps.map(o => o.siteName.toLowerCase()));
    console.log(`📊 Existing opportunities: ${existingSiteNames.size}\n`);
    
    // Fetch all WordPress posts
    const posts = await fetchAllPosts();
    
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    
    console.log('📝 Importing posts...\n');
    
    for (const post of posts) {
      try {
        // Extract site name from title
        const siteName = post.title.rendered
          .replace(/&#8211;/g, '-')
          .replace(/&#8217;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/<[^>]*>/g, '')
          .trim();
        
        // Skip if already exists
        if (existingSiteNames.has(siteName.toLowerCase())) {
          skipped++;
          continue;
        }
        
        // Extract data from content
        const content = post.content.rendered || '';
        const extracted = extractDataFromContent(content);
        
        // Determine URL
        let url = extracted.url;
        if (!url || url.includes('rankdseo.com')) {
          // Use post link as fallback
          url = post.link || `https://example.com/${siteName.toLowerCase().replace(/\s+/g, '-')}`;
        }
        
        // Generate descriptions
        const shortDesc = generateDescription(siteName, url, extracted.domainAuthority, extracted.isDofollow);
        const fullDesc = generateFullDescription(siteName, url, extracted.domainAuthority);
        
        // Create the opportunity
        await prisma.backlinkOpportunity.create({
          data: {
            siteName: siteName,
            url: url,
            shortDescription: shortDesc,
            fullDescription: fullDesc,
            category: 'Directory',
            niche: 'General',
            language: 'en',
            linkType: 'PROFILE',
            isFree: true,
            difficultyLevel: 2,
            domainAuthority: extracted.domainAuthority || null,
            isDofollow: extracted.isDofollow !== false,
            status: 'ACTIVE',
          },
        });
        
        existingSiteNames.add(siteName.toLowerCase());
        imported++;
        
        if (imported % 50 === 0) {
          console.log(`   ✅ Imported ${imported} opportunities...`);
        }
        
      } catch (err) {
        failed++;
        if (failed <= 5) {
          console.error(`   ❌ Error importing post:`, err.message);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Import Summary:`);
    console.log(`   Total WordPress posts: ${posts.length}`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped (duplicates): ${skipped}`);
    console.log(`   Failed: ${failed}`);
    console.log('='.repeat(60));
    
    // Final count
    const finalCount = await prisma.backlinkOpportunity.count();
    console.log(`\n✅ Total opportunities in database: ${finalCount}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importAllPosts();
