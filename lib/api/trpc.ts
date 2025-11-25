import { initTRPC, TRPCError } from '@trpc/server';
import { prisma } from '@/lib/db/prisma';
import superjson from 'superjson';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { decode } from 'next-auth/jwt';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  let session = null;

  try {
    // Get cookies from request
    const cookieHeader = opts.req.headers.get('cookie');
    
    if (cookieHeader) {
      // Parse cookies manually
      const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(c => {
          const [key, ...v] = c.split('=');
          return [key, v.join('=')];
        })
      );

      // NextAuth session token can be in different cookie names
      const sessionToken = 
        cookies['next-auth.session-token'] || 
        cookies['__Secure-next-auth.session-token'] ||
        cookies['authjs.session-token'] ||
        cookies['__Secure-authjs.session-token'];

      if (sessionToken) {
        // Decode the JWT token
        const decoded = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET!,
        });

        if (decoded) {
          session = {
            user: {
              id: decoded.id as string,
              email: decoded.email as string,
              name: decoded.name as string,
              role: decoded.role as string,
            },
            expires: new Date(decoded.exp! * 1000).toISOString(),
          };
        }
      }
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