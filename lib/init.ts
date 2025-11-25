import { startScheduler } from './scheduler';

// Initialize background jobs
if (typeof window === 'undefined') {
  // Only run on server side
  console.log('🚀 Initializing server-side jobs...');
  // Delay scheduler start to avoid startup issues
  setTimeout(() => {
    startScheduler();
  }, 10000); // Start after 10 seconds
}
