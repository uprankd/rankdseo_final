import { startScheduler } from './scheduler';

// Initialize background jobs
if (typeof window === 'undefined') {
  // Only run on server side
  console.log('🚀 Initializing server-side jobs...');
  startScheduler();
}
