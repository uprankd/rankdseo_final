import { initTRPC, TRPCError } from '@trpc/server';
import { prisma } from '@/lib/db/prisma';
import superjson from 'superjson';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getToken } from 'next-auth/jwt';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  let session = null;

  try {
    // Use getToken to extract the session - it handles all the complexity
    const token = await getToken({
      req: opts.req as any,
      secret: process.env.NEXTAUTH_SECRET!,
      secureCookie: true, // We're using HTTPS
    });

    console.log('[tRPC] Token found:', !!token);

    if (token) {
      session = {
        user: {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as string,
        },
        expires: new Date(token.exp! * 1000).toISOString(),
      };
      console.log('[tRPC] Session created for:', token.email);
    }
  } catch (error) {
    console.error('[tRPC Context] Error extracting session:', error);
  }

  return {
    session,
    prisma,
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