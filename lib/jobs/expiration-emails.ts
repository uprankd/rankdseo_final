import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from '@/lib/mailgun';

const prisma = new PrismaClient();

export async function sendAutomatedExpirationEmails() {
  console.log('📧 Running automated expiration email check...');

  const now = new Date();

  try {
    // Find expired subscriptions that haven't been emailed yet
    const expiredSubs = await prisma.subscription.findMany({
      where: {
        currentPeriodEnd: { lt: now },
        status: 'ACTIVE',
        expirationEmailSentAt: null,
        user: {
          role: 'USER',
          email: { not: 'demo@rankdseo.com' },
        },
        plan: { price: { gt: 0 } },
      },
      include: {
        user: true,
        plan: true,
      },
    });

    if (expiredSubs.length === 0) {
      console.log('📧 No new expired subscriptions to notify');
      return { sent: 0, failed: 0, total: 0 };
    }

    console.log(`📧 Found ${expiredSubs.length} expired subscriptions to notify`);

    let sent = 0;
    let failed = 0;

    for (const sub of expiredSubs) {
      try {
        const expiredDate = sub.currentPeriodEnd
          ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })
          : 'N/A';

        const template = emailTemplates.subscriptionExpired(
          sub.user.name || sub.user.email,
          sub.plan.name,
          expiredDate,
        );

        await sendEmail({
          to: sub.user.email,
          subject: template.subject,
          html: template.html,
        });

        // Mark as sent so we don't email again
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { expirationEmailSentAt: now },
        });

        console.log(`📧 Expiration email sent to ${sub.user.email}`);
        sent++;
      } catch (error) {
        console.error(`❌ Failed to send expiration email to ${sub.user.email}:`, error);
        failed++;
      }
    }

    console.log(`📧 Expiration emails complete: ${sent} sent, ${failed} failed`);
    return { sent, failed, total: expiredSubs.length };
  } catch (error) {
    console.error('❌ Error in automated expiration email job:', error);
    return { sent: 0, failed: 0, total: 0 };
  }
}
