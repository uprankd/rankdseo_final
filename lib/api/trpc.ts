import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import superjson from 'superjson';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Extract session from the request using NextAuth v5
  // Must pass request to auth() to access session cookies
  const session = await auth(opts.req, opts.resHeaders);
  
  return {
    session,
    prisma,
    req: opts.req,
    resHeaders: opts.resHeaders,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});