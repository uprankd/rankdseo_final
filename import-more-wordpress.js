const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WP_BASE_URL = 'https://rankdseo.com/wp-json/wp/v2';

// Fetch posts from WordPress with pagination - starting from specific page
async function fetchPosts(startPage = 1, maxPages = 100) {
  const allPosts = [];
  let page = startPage;
  const perPage = 100;
  let consecutiveErrors = 0;
  
  console.log(`📥 Fetching posts from WordPress (starting page ${startPage})...\n`);
  
  while (page < startPage + maxPages && consecutiveErrors < 3) {
    try {
      const url = `${WP_BASE_URL}/posts?per_page=${perPage}&page=${page}`;
      console.log(`   Fetching page ${page}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 400) {
          console.log('   Reached end of posts');
          break;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const posts = await response.json();
      
      if (posts.length === 0) {
        break;
      }
      
      allPosts.push(...posts);
      console.log(`   ✅ Got ${posts.length} posts (total: ${allPosts.length})`);
      consecutiveErrors = 0;
      
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      if (page >= totalPages) {
        break;
      }
      
      page++;
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`   ❌ Error on page ${page}: ${error.message}`);
      consecutiveErrors++;
      
      if (consecutiveErrors < 3) {
        console.log(`   ⏳ Waiting 2s before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.log(`\n✅ Fetched ${allPosts.length} posts\n`);
  return allPosts;
}

// Extract data from WordPress post HTML content
function extractDataFromContent(htmlContent) {
  const data = {};
  
  const websiteMatch = htmlContent.match(/<strong>Website<\/strong>:\s*<a[^>]*href="([^"]+)"[^>]*>/i) ||
                       htmlContent.match(/Website:\s*<a[^>]*href="([^"]+)"[^>]*>/i) ||
                       htmlContent.match(/href="(https?:\/\/[^"]+)"[^>]*>[^<]*<\/a>/i);
  if (websiteMatch) {
    data.url = websiteMatch[1];
  }
  
  const daMatch = htmlContent.match(/<strong>DA<\/strong>:\s*(\d+)/i) || htmlContent.match(/DA:\s*(\d+)/i);
  if (daMatch) {
    data.domainAuthority = parseInt(daMatch[1]);
  }
  
  const doFollowMatch = htmlContent.match(/<strong>Do-Follow<\/strong>:\s*(YES|NO)/i) || htmlContent.match(/Do-Follow:\s*(YES|NO)/i);
  if (doFollowMatch) {
    data.isDofollow = doFollowMatch[1].toUpperCase() === 'YES';
  }
  
  return data;
}

function generateDescription(siteName, url, da, isDofollow) {
  let domain = '';
  try { domain = new URL(url).hostname.replace('www.', ''); } catch { domain = siteName.toLowerCase(); }
  
  const linkText = isDofollow !== false ? 'dofollow' : 'nofollow';
  const daText = da ? `DA ${da}` : '';
  
  const templates = [
    `Create a free profile on ${siteName} (${domain}) for ${linkText} backlinks.${daText ? ` ${daText}.` : ''}`,
    `Get a ${linkText} backlink from ${siteName}.${daText ? ` ${daText}.` : ''} Free profile creation.`,
    `Build backlinks on ${siteName} (${domain}).${daText ? ` ${daText},` : ''} ${linkText} links.`,
  ];
  
  let desc = templates[siteName.length % 3];
  return desc.length > 150 ? desc.substring(0, 147) + '...' : desc;
}

function generateFullDescription(siteName, url, da) {
  let domain = '';
  try { domain = new URL(url).hostname.replace('www.', ''); } catch { domain = siteName.toLowerCase(); }
  
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

async function importPosts(startPage = 1) {
  try {
    const existingOpps = await prisma.backlinkOpportunity.findMany({ select: { siteName: true } });
    const existingSiteNames = new Set(existingOpps.map(o => o.siteName.toLowerCase()));
    console.log(`📊 Existing opportunities: ${existingSiteNames.size}\n`);
    
    const posts = await fetchPosts(startPage, 20);
    
    let imported = 0, skipped = 0, failed = 0;
    
    console.log('📝 Importing posts...\n');
    
    for (const post of posts) {
      try {
        const siteName = post.title.rendered
          .replace(/&#8211;/g, '-').replace(/&#8217;/g, "'").replace(/&amp;/g, '&').replace(/<[^>]*>/g, '').trim();
        
        if (existingSiteNames.has(siteName.toLowerCase())) { skipped++; continue; }
        
        const content = post.content.rendered || '';
        const extracted = extractDataFromContent(content);
        
        let url = extracted.url;
        if (!url || url.includes('rankdseo.com')) {
          url = post.link || `https://example.com/${siteName.toLowerCase().replace(/\s+/g, '-')}`;
        }
        
        await prisma.backlinkOpportunity.create({
          data: {
            siteName, url,
            shortDescription: generateDescription(siteName, url, extracted.domainAuthority, extracted.isDofollow),
            fullDescription: generateFullDescription(siteName, url, extracted.domainAuthority),
            category: 'Directory', niche: 'General', language: 'en', linkType: 'PROFILE',
            isFree: true, difficultyLevel: 2,
            domainAuthority: extracted.domainAuthority || null,
            isDofollow: extracted.isDofollow !== false,
            status: 'ACTIVE',
          },
        });
        
        existingSiteNames.add(siteName.toLowerCase());
        imported++;
        if (imported % 50 === 0) console.log(`   ✅ Imported ${imported}...`);
      } catch (err) { failed++; }
    }
    
    console.log(`\n✅ Imported: ${imported}, Skipped: ${skipped}, Failed: ${failed}`);
    
    const finalCount = await prisma.backlinkOpportunity.count();
    console.log(`📊 Total in database: ${finalCount}`);
    
  } finally {
    await prisma.$disconnect();
  }
}

// Get start page from command line argument
const startPage = parseInt(process.argv[2]) || 6;
importPosts(startPage);
