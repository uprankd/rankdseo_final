const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();
const SCREENSHOTS_DIR = path.join(process.cwd(), 'public', 'screenshots');

// Ensure directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Download a file from URL
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    if (!url || url.startsWith('/')) {
      resolve(false);
      return;
    }
    
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    const request = protocol.get(url, { timeout: 30000 }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        file.close();
        fs.unlinkSync(filepath);
        downloadFile(redirectUrl, filepath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    });
    
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(err);
    });
    
    request.on('timeout', () => {
      request.destroy();
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(new Error('Timeout'));
    });
  });
}

// Generate a unique filename from URL
function getFilename(url, id) {
  try {
    const urlObj = new URL(url);
    const ext = path.extname(urlObj.pathname) || '.jpg';
    return `${id}${ext}`;
  } catch {
    return `${id}.jpg`;
  }
}

async function downloadAllScreenshots() {
  try {
    console.log('📥 Fetching all instructions with external screenshots...\n');
    
    const instructions = await prisma.opportunityInstruction.findMany({
      where: {
        screenshotUrl: { not: null }
      },
      select: {
        id: true,
        screenshotUrl: true,
        opportunityId: true
      }
    });
    
    // Filter only external URLs
    const external = instructions.filter(i => 
      i.screenshotUrl && 
      !i.screenshotUrl.startsWith('/screenshots/') &&
      i.screenshotUrl.startsWith('http')
    );
    
    console.log(`📊 Total instructions: ${instructions.length}`);
    console.log(`📊 External images to download: ${external.length}\n`);
    
    let downloaded = 0;
    let failed = 0;
    let skipped = 0;
    
    // Process in batches of 10 for performance
    const batchSize = 10;
    
    for (let i = 0; i < external.length; i += batchSize) {
      const batch = external.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (instruction) => {
        const filename = getFilename(instruction.screenshotUrl, instruction.id);
        const filepath = path.join(SCREENSHOTS_DIR, filename);
        const localUrl = `/screenshots/${filename}`;
        
        // Skip if already downloaded
        if (fs.existsSync(filepath)) {
          // Update database to use local URL
          await prisma.opportunityInstruction.update({
            where: { id: instruction.id },
            data: { screenshotUrl: localUrl }
          });
          skipped++;
          return;
        }
        
        try {
          await downloadFile(instruction.screenshotUrl, filepath);
          
          // Update database to use local URL
          await prisma.opportunityInstruction.update({
            where: { id: instruction.id },
            data: { screenshotUrl: localUrl }
          });
          
          downloaded++;
        } catch (err) {
          failed++;
          // Keep original URL if download fails
        }
      }));
      
      // Progress update
      if ((i + batchSize) % 100 === 0 || i + batchSize >= external.length) {
        console.log(`   Progress: ${Math.min(i + batchSize, external.length)}/${external.length} (Downloaded: ${downloaded}, Failed: ${failed}, Skipped: ${skipped})`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Downloaded: ${downloaded}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Skipped (already local): ${skipped}`);
    console.log('='.repeat(60));
    
    // Check directory size
    const files = fs.readdirSync(SCREENSHOTS_DIR);
    console.log(`\n📁 Total files in screenshots folder: ${files.length}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

downloadAllScreenshots();
