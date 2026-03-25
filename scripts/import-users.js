const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Simple CSV parser that handles quoted fields
function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Plan name mapping from CSV membership to DB plan name
const PLAN_MAP = {
  'Monthly Membership': 'Monthly Membership',
  '1 Year Membership': '1 Year Membership',
  '3 Month Membership': '3 Month Membership',
  'Lifetime membership (99 Years)': 'Lifetime Membership',
};

async function main() {
  // Read CSV
  const csvPath = path.join(__dirname, 'members.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvText);
  console.log(`Parsed ${rows.length} rows from CSV`);

  const hashedPassword = await bcrypt.hash('Rankdseo2025!', 10);
  const now = new Date();

  // Step 1: Create hidden 3 Month plan if not exists
  let threeMonthPlan = await prisma.plan.findFirst({ where: { name: '3 Month Membership' } });
  if (!threeMonthPlan) {
    threeMonthPlan = await prisma.plan.create({
      data: {
        name: '3 Month Membership',
        description: '3-month access to all backlink opportunities',
        price: 3499,
        interval: 'quarter',
        maxProjects: 100,
        maxOpportunities: 1000,
        features: ['1000 backlink opportunities', '100 projects', 'Priority support', 'Auto link verification'],
        isActive: true,
      },
    });
    console.log('Created 3 Month Membership plan:', threeMonthPlan.id);
  } else {
    console.log('3 Month Membership plan already exists:', threeMonthPlan.id);
  }

  // Get all plans
  const plans = await prisma.plan.findMany();
  const planByName = {};
  for (const p of plans) {
    planByName[p.name] = p;
  }
  console.log('Plans available:', Object.keys(planByName));

  // Step 2: Import users
  let created = 0, skipped = 0, errors = 0;

  for (const row of rows) {
    const emailLower = (row.email || '').toLowerCase().trim();
    if (!emailLower) {
      console.error('Skipping row with no email:', JSON.stringify(row));
      errors++;
      continue;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      skipped++;
      continue;
    }

    // Determine plan
    const membership = (row.membership || '').trim();
    const planName = PLAN_MAP[membership];
    const plan = planByName[planName];
    if (!plan) {
      console.error(`No plan found for "${membership}" (user: ${emailLower})`);
      errors++;
      continue;
    }

    // Calculate period end
    let periodEnd;
    if (membership === 'Lifetime membership (99 Years)') {
      periodEnd = new Date(now.getTime() + 99 * 365 * 24 * 60 * 60 * 1000);
    } else if (membership === '1 Year Membership') {
      periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else if (membership === '3 Month Membership') {
      periodEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    } else {
      // Monthly
      periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const firstname = (row.firstname || '').trim();
    const lastname = (row.lastname || '').trim();
    const username = (row.username || '').trim();
    const name = [firstname, lastname].filter(Boolean).join(' ') || username || null;

    try {
      await prisma.user.create({
        data: {
          email: emailLower,
          name: name,
          password: hashedPassword,
          role: 'USER',
          accountStatus: 'ACTIVE',
          subscription: {
            create: {
              planId: plan.id,
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          },
        },
      });
      created++;
      if (created % 50 === 0) {
        console.log(`Progress: ${created} created so far...`);
      }
    } catch (err) {
      console.error(`Error creating ${emailLower}:`, err.message);
      errors++;
    }
  }

  console.log(`\n========== IMPORT COMPLETE ==========`);
  console.log(`Total CSV rows: ${rows.length}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Errors: ${errors}`);
  
  // Final count
  const totalUsers = await prisma.user.count();
  const totalSubs = await prisma.subscription.count();
  console.log(`\nTotal users in DB: ${totalUsers}`);
  console.log(`Total subscriptions in DB: ${totalSubs}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
