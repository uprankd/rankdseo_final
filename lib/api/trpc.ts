import { initTRPC, TRPCError } from '@trpc/server';
import { prisma } from '@/lib/db/prisma';
import superjson from 'superjson';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getToken } from 'next-auth/jwt';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Extract JWT token from cookies using NextAuth's getToken
  const token = await getToken({
    req: opts.req as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Convert token to session format
  const session = token
    ? {
        user: {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as string,
        },
        expires: new Date(token.exp! * 1000).toISOString(),
      }
    : null;
  
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