import { verifyAllLinks } from '@/lib/jobs/link-verification';

let intervalId: NodeJS.Timeout | null = null;

export function startScheduler() {
  // Don't start if already running
  if (intervalId) {
    console.log('⏰ Scheduler already running');
    return;
  }

  console.log('⏰ Starting automatic link verification scheduler (every 10 minutes)');

  // Run immediately on startup
  verifyAllLinks().catch(console.error);

  // Then run every 10 minutes
  intervalId = setInterval(() => {
    console.log('⏰ Running scheduled link verification...');
    verifyAllLinks().catch(console.error);
  }, 10 * 60 * 1000); // 10 minutes in milliseconds

  console.log('✅ Scheduler started successfully');
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('⏹️ Scheduler stopped');
  }
}
