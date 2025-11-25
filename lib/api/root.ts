import { router } from './trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { subscriptionRouter } from './routers/subscription';
import { projectRouter } from './routers/project';
import { opportunityRouter } from './routers/opportunity';
import { adminRouter } from './routers/admin';
import { settingsRouter } from './routers/settings';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  subscription: subscriptionRouter,
  project: projectRouter,
  opportunity: opportunityRouter,
  admin: adminRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;