import { verifyAllLinks } from '@/lib/jobs/link-verification';
import { sendWeeklyReports, sendMonthlyReports } from '@/lib/jobs/report-scheduler';
import { sendAutomatedExpirationEmails } from '@/lib/jobs/expiration-emails';

let linkVerificationIntervalId: NodeJS.Timeout | null = null;
let weeklyReportIntervalId: NodeJS.Timeout | null = null;
let monthlyReportIntervalId: NodeJS.Timeout | null = null;
let expirationEmailIntervalId: NodeJS.Timeout | null = null;

// Check if it's Monday at 9 AM (for weekly reports)
function isWeeklyReportTime(): boolean {
  const now = new Date();
  return now.getDay() === 1 && now.getHours() === 9 && now.getMinutes() < 10;
}

// Check if it's the 1st of the month at 9 AM (for monthly reports)
function isMonthlyReportTime(): boolean {
  const now = new Date();
  return now.getDate() === 1 && now.getHours() === 9 && now.getMinutes() < 10;
}

// Check if it's 8 AM (daily expiration email check)
function isDailyExpirationTime(): boolean {
  const now = new Date();
  return now.getHours() === 8 && now.getMinutes() < 10;
}

export function startScheduler() {
  // Don't start if already running
  if (linkVerificationIntervalId) {
    console.log('⏰ Scheduler already running');
    return;
  }

  console.log('⏰ Starting automatic link verification scheduler (every 10 minutes)');

  // Run link verification immediately on startup
  verifyAllLinks().catch(console.error);

  // Link verification - every 10 minutes
  linkVerificationIntervalId = setInterval(() => {
    console.log('⏰ Running scheduled link verification...');
    verifyAllLinks().catch(console.error);
  }, 10 * 60 * 1000); // 10 minutes

  // Weekly report check - every 10 minutes (will only send on Monday 9 AM)
  console.log('📅 Starting weekly report scheduler (Mondays at 9 AM)');
  weeklyReportIntervalId = setInterval(() => {
    if (isWeeklyReportTime()) {
      console.log('📧 Triggering weekly reports...');
      sendWeeklyReports().catch(console.error);
    }
  }, 10 * 60 * 1000); // Check every 10 minutes

  // Monthly report check - every 10 minutes (will only send on 1st of month 9 AM)
  console.log('📅 Starting monthly report scheduler (1st of each month at 9 AM)');
  monthlyReportIntervalId = setInterval(() => {
    if (isMonthlyReportTime()) {
      console.log('📧 Triggering monthly reports...');
      sendMonthlyReports().catch(console.error);
    }
  }, 10 * 60 * 1000); // Check every 10 minutes

  // Daily expiration email check - every 10 minutes (will only send at 8 AM)
  console.log('📧 Starting daily expiration email scheduler (daily at 8 AM)');
  expirationEmailIntervalId = setInterval(() => {
    if (isDailyExpirationTime()) {
      console.log('📧 Triggering automated expiration emails...');
      sendAutomatedExpirationEmails().catch(console.error);
    }
  }, 10 * 60 * 1000); // Check every 10 minutes

  console.log('✅ Scheduler started successfully');
}

export function stopScheduler() {
  if (linkVerificationIntervalId) {
    clearInterval(linkVerificationIntervalId);
    linkVerificationIntervalId = null;
  }
  if (weeklyReportIntervalId) {
    clearInterval(weeklyReportIntervalId);
    weeklyReportIntervalId = null;
  }
  if (monthlyReportIntervalId) {
    clearInterval(monthlyReportIntervalId);
    monthlyReportIntervalId = null;
  }
  if (expirationEmailIntervalId) {
    clearInterval(expirationEmailIntervalId);
    expirationEmailIntervalId = null;
  }
  console.log('⏹️ All schedulers stopped');
}

// Export for manual triggering from admin panel
export { sendWeeklyReports, sendMonthlyReports } from '@/lib/jobs/report-scheduler';
export { sendAutomatedExpirationEmails } from '@/lib/jobs/expiration-emails';
