import { prisma } from '@/lib/db/prisma';

export async function verifyAllLinks() {
  console.log('🔍 Starting automatic link verification job...');
  
  try {
    // Get all project opportunities that have links and are APPROVED or SUBMITTED
    const opportunities = await prisma.projectOpportunity.findMany({
      where: {
        linkUrl: { not: null },
        status: { in: ['APPROVED', 'SUBMITTED'] },
      },
      include: {
        opportunity: true,
        project: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log(`📊 Found ${opportunities.length} links to verify`);

    let verified = 0;
    let approved = 0;
    let rejected = 0;
    let failed = 0;

    // Verify each link
    for (const po of opportunities) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(po.linkUrl!, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeoutId);
        verified++;

        const isLive = response.ok || (response.status >= 300 && response.status < 400);

        if (isLive) {
          // Link is working
          if (po.status === 'SUBMITTED') {
            // Auto-approve submitted links that are working
            await prisma.projectOpportunity.update({
              where: { id: po.id },
              data: {
                status: 'APPROVED',
                approvedAt: new Date(),
              },
            });

            await prisma.activityLog.create({
              data: {
                userId: po.project.userId,
                projectId: po.projectId,
                type: 'STATUS_CHANGE',
                title: `${po.opportunity.siteName} auto-approved (background check)`,
              },
            });

            approved++;
            console.log(`✅ Auto-approved: ${po.opportunity.siteName} - ${po.linkUrl}`);
          }
        } else {
          // Link is broken - reject if currently approved or submitted
          if (po.status === 'APPROVED' || po.status === 'SUBMITTED') {
            await prisma.projectOpportunity.update({
              where: { id: po.id },
              data: {
                status: 'REJECTED',
                rejectedAt: new Date(),
                notes: `Auto-rejected: Link returned HTTP ${response.status}`,
              },
            });

            await prisma.activityLog.create({
              data: {
                userId: po.project.userId,
                projectId: po.projectId,
                type: 'STATUS_CHANGE',
                title: `${po.opportunity.siteName} auto-rejected (link broken)`,
              },
            });

            rejected++;
            console.log(`❌ Auto-rejected: ${po.opportunity.siteName} - HTTP ${response.status}`);
          }
        }

        // Small delay to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        // Link verification failed - reject if currently approved
        if (po.status === 'APPROVED') {
          await prisma.projectOpportunity.update({
            where: { id: po.id },
            data: {
              status: 'REJECTED',
              rejectedAt: new Date(),
              notes: `Auto-rejected: ${error.message || 'Link verification failed'}`,
            },
          });

          await prisma.activityLog.create({
            data: {
              userId: po.project.userId,
              projectId: po.projectId,
              type: 'STATUS_CHANGE',
              title: `${po.opportunity.siteName} auto-rejected (unreachable)`,
            },
          });

          rejected++;
          console.log(`❌ Auto-rejected (error): ${po.opportunity.siteName} - ${error.message}`);
        } else {
          failed++;
        }

        // Small delay even on errors
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Verification complete: ${verified} verified, ${approved} approved, ${rejected} rejected, ${failed} failed`);

    return {
      success: true,
      total: opportunities.length,
      verified,
      approved,
      rejected,
      failed,
    };

  } catch (error) {
    console.error('❌ Link verification job failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
