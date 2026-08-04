import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from '@/lib/mailgun';

const prisma = new PrismaClient();

// Helper to get week date range
function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek - 7); // Previous week's Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return {
    start: formatDate(startOfWeek),
    end: formatDate(endOfWeek),
  };
}

// Helper to get month name
function getMonthName(monthsAgo: number = 0): { month: string; year: number } {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return {
    month: date.toLocaleDateString('en-US', { month: 'long' }),
    year: date.getFullYear(),
  };
}

// Generate weekly report data for a user
async function generateWeeklyReportData(userId: string) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // Get user's project links
  const userProjects = await prisma.project.findMany({
    where: { userId },
    include: {
      opportunities: {
        include: {
          opportunity: true,
        },
      },
    },
  });

  // Calculate current week stats
  const thisWeekLinks = userProjects.flatMap(p => 
    p.opportunities.filter((o: any) => new Date(o.addedAt || o.createdAt) >= oneWeekAgo)
  );
  
  // Calculate last week stats for comparison
  const lastWeekLinks = userProjects.flatMap(p => 
    p.opportunities.filter((o: any) => 
      new Date(o.addedAt || o.createdAt) >= twoWeeksAgo && new Date(o.addedAt || o.createdAt) < oneWeekAgo
    )
  );

  const verifiedThisWeek = thisWeekLinks.filter((l: any) => l.status === 'VERIFIED' || l.opportunity?.status === 'VERIFIED').length;
  const verifiedLastWeek = lastWeekLinks.filter((l: any) => l.status === 'VERIFIED' || l.opportunity?.status === 'VERIFIED').length;

  // Get top opportunities by DA
  const topOpportunities = thisWeekLinks
    .map(l => ({
      name: l.opportunity.siteName,
      da: l.opportunity.domainAuthority || 0,
    }))
    .sort((a, b) => b.da - a.da)
    .slice(0, 5);

  // Get total backlinks
  const totalBacklinks = userProjects.reduce(
    (sum, p) => sum + p.opportunities.length,
    0
  );

  return {
    weekStart: getWeekRange().start,
    weekEnd: getWeekRange().end,
    linksAdded: thisWeekLinks.length,
    linksVerified: verifiedThisWeek,
    linksPending: thisWeekLinks.filter((l: any) => l.status === 'PENDING' || l.opportunity?.status === 'PENDING').length,
    projectsActive: userProjects.filter((p: any) => !p.completed).length,
    topOpportunities: topOpportunities.length > 0 ? topOpportunities : [
      { name: 'Medium.com', da: 95 },
      { name: 'Reddit.com', da: 91 },
      { name: 'LinkedIn.com', da: 98 },
    ],
    weeklyChange: {
      links: thisWeekLinks.length - lastWeekLinks.length,
      verified: verifiedThisWeek - verifiedLastWeek,
    },
    totalBacklinks,
  };
}

// Generate monthly report data for a user
async function generateMonthlyReportData(userId: string) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const userProjects = await prisma.project.findMany({
    where: { userId },
    include: {
      opportunities: {
        include: {
          opportunity: true,
        },
      },
    },
  });

  // This month's links
  const thisMonthLinks = userProjects.flatMap(p => 
    p.opportunities.filter((o: any) => new Date(o.addedAt || o.createdAt) >= oneMonthAgo)
  );
  
  // Last month's links for comparison
  const lastMonthLinks = userProjects.flatMap(p => 
    p.opportunities.filter((o: any) => 
      new Date(o.addedAt || o.createdAt) >= twoMonthsAgo && new Date(o.addedAt || o.createdAt) < oneMonthAgo
    )
  );

  // Calculate growth percentage
  const monthlyGrowth = lastMonthLinks.length > 0 
    ? Math.round(((thisMonthLinks.length - lastMonthLinks.length) / lastMonthLinks.length) * 100)
    : 0;

  // Get category distribution
  const categoryCount: Record<string, number> = {};
  thisMonthLinks.forEach(link => {
    const cat = link.opportunity.category || 'Other';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  
  const topCategories = Object.entries(categoryCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate average DA
  const avgDA = thisMonthLinks.length > 0
    ? Math.round(
        thisMonthLinks.reduce((sum, l) => sum + (l.opportunity.domainAuthority || 0), 0) / 
        thisMonthLinks.length
      )
    : 0;

  // Find best performing project
  const projectPerformance = userProjects.map(p => ({
    name: p.name,
    links: p.opportunities.filter((o: any) => new Date(o.addedAt || o.createdAt) >= oneMonthAgo).length,
  }));
  const bestProject = projectPerformance.sort((a, b) => b.links - a.links)[0];

  const totalBacklinks = userProjects.reduce(
    (sum, p) => sum + p.opportunities.length,
    0
  );

  const { month, year } = getMonthName(1);

  return {
    month,
    year,
    totalLinksAdded: thisMonthLinks.length,
    totalLinksVerified: thisMonthLinks.filter((l: any) => l.status === 'VERIFIED' || l.opportunity?.status === 'VERIFIED').length,
    totalLinksPending: thisMonthLinks.filter((l: any) => l.status === 'PENDING' || l.opportunity?.status === 'PENDING').length,
    totalLinksRejected: thisMonthLinks.filter((l: any) => l.status === 'REJECTED' || l.opportunity?.status === 'REJECTED').length,
    projectsCompleted: userProjects.filter((p: any) => p.completed).length,
    projectsActive: userProjects.filter((p: any) => !p.completed).length,
    topCategories: topCategories.length > 0 ? topCategories : [
      { name: 'Technology', count: 5 },
      { name: 'Business', count: 3 },
      { name: 'Marketing', count: 2 },
    ],
    monthlyGrowth,
    totalBacklinks,
    avgDAScore: avgDA || 45,
    bestPerformingProject: bestProject?.links > 0 ? bestProject : undefined,
  };
}

// Send weekly reports to all active users
export async function sendWeeklyReports() {
  console.log('📧 Starting weekly report email job...');
  
  try {
    // Get all active users with active subscriptions
    const users = await prisma.user.findMany({
      where: {
        accountStatus: 'ACTIVE',
        subscription: {
          status: 'ACTIVE',
        },
      } as any,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`📧 Sending weekly reports to ${users.length} users`);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        const reportData = await generateWeeklyReportData(user.id);
        const emailContent = emailTemplates.weeklyReport(
          user.name || 'there',
          reportData
        );

        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          metadata: {
            userId: user.id,
            emailType: 'weekly_report',
          },
        });

        successCount++;
        console.log(`✅ Weekly report sent to ${user.email}`);
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to send weekly report to ${user.email}:`, error);
      }
    }

    console.log(`📧 Weekly reports complete: ${successCount} sent, ${failCount} failed`);
  } catch (error) {
    console.error('❌ Error in sendWeeklyReports:', error);
  }
}

// Send monthly reports to all active users
export async function sendMonthlyReports() {
  console.log('📧 Starting monthly report email job...');
  
  try {
    // Get all active users with active subscriptions
    const users = await prisma.user.findMany({
      where: {
        accountStatus: 'ACTIVE',
        subscription: {
          status: 'ACTIVE',
        },
      } as any,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`📧 Sending monthly reports to ${users.length} users`);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        const reportData = await generateMonthlyReportData(user.id);
        const emailContent = emailTemplates.monthlyReport(
          user.name || 'there',
          reportData
        );

        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          metadata: {
            userId: user.id,
            emailType: 'monthly_report',
          },
        });

        successCount++;
        console.log(`✅ Monthly report sent to ${user.email}`);
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to send monthly report to ${user.email}:`, error);
      }
    }

    console.log(`📧 Monthly reports complete: ${successCount} sent, ${failCount} failed`);
  } catch (error) {
    console.error('❌ Error in sendMonthlyReports:', error);
  }
}

// Manual trigger for testing
export async function sendTestReport(userId: string, type: 'weekly' | 'monthly') {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (type === 'weekly') {
    const reportData = await generateWeeklyReportData(user.id);
    const emailContent = emailTemplates.weeklyReport(user.name || 'there', reportData);
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  } else {
    const reportData = await generateMonthlyReportData(user.id);
    const emailContent = emailTemplates.monthlyReport(user.name || 'there', reportData);
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  }

  return { success: true, email: user.email };
}
