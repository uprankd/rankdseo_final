import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { detectSpam } from '../../spam-detector';

export const supportRouter = router({
  // User: create a ticket
  createTicket: protectedProcedure
    .input(z.object({
      subject: z.string().min(3, 'Subject must be at least 3 characters'),
      message: z.string().min(10, 'Message must be at least 10 characters'),
      category: z.enum(['general', 'billing', 'technical', 'account', 'feature']).default('general'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check user's subscription status
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: {
          subscription: {
            include: { plan: true }
          }
        }
      });

      const hasActiveSubscription = user?.subscription?.status === 'ACTIVE' && 
                                     (user?.subscription?.plan?.price || 0) > 0;

      // Count previous tickets
      const ticketCount = await ctx.prisma.supportTicket.count({
        where: { userId: ctx.user.id }
      });

      // Run spam detection
      const spamCheck = detectSpam({
        subject: input.subject,
        message: input.message,
        userEmail: ctx.user.email,
        userName: ctx.user.name,
        hasActiveSubscription,
        ticketCount,
      });

      console.log(`📧 Ticket spam check for ${ctx.user.email}:`, {
        isSpam: spamCheck.isSpam,
        score: spamCheck.spamScore,
        reasons: spamCheck.reasons,
      });

      const ticket = await ctx.prisma.supportTicket.create({
        data: {
          subject: input.subject,
          message: input.message,
          category: input.category,
          priority: input.priority,
          userId: ctx.user.id,
          isSpam: spamCheck.isSpam,
          spamScore: spamCheck.spamScore,
          spamReason: spamCheck.reasons.join(' | '),
        },
      });

      return { 
        id: ticket.id,
        isSpam: spamCheck.isSpam,
        spamScore: spamCheck.spamScore,
      };
    }),

  // User: list their own tickets
  listMyTickets: protectedProcedure.query(async ({ ctx }) => {
    const tickets = await ctx.prisma.supportTicket.findMany({
      where: { userId: ctx.user.id },
      include: {
        replies: {
          include: { user: { select: { name: true, email: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return tickets;
  }),

  // User: get single ticket
  getTicket: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.supportTicket.findFirst({
        where: {
          id: input.ticketId,
          ...(ctx.user.role !== 'ADMIN' ? { userId: ctx.user.id } : {}),
        },
        include: {
          user: { select: { name: true, email: true, role: true } },
          replies: {
            include: { user: { select: { name: true, email: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
      return ticket;
    }),

  // User: reply to their own ticket
  replyToTicket: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      message: z.string().min(1, 'Reply cannot be empty'),
    }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === 'ADMIN';

      const ticket = await ctx.prisma.supportTicket.findFirst({
        where: {
          id: input.ticketId,
          ...(isAdmin ? {} : { userId: ctx.user.id }),
        },
      });

      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });

      const reply = await ctx.prisma.supportReply.create({
        data: {
          message: input.message,
          isAdmin,
          ticketId: input.ticketId,
          userId: ctx.user.id,
        },
      });

      // Update ticket status
      await ctx.prisma.supportTicket.update({
        where: { id: input.ticketId },
        data: { status: isAdmin ? 'ANSWERED' : 'OPEN' },
      });

      return { id: reply.id };
    }),

  // User: close their own ticket
  closeTicket: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.supportTicket.findFirst({
        where: {
          id: input.ticketId,
          ...(ctx.user.role !== 'ADMIN' ? { userId: ctx.user.id } : {}),
        },
      });
      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });

      await ctx.prisma.supportTicket.update({
        where: { id: input.ticketId },
        data: { status: 'CLOSED' },
      });
      return { success: true };
    }),

  // Admin: list all tickets (excluding spam by default)
  listAllTickets: adminProcedure
    .input(z.object({
      status: z.enum(['OPEN', 'ANSWERED', 'CLOSED', 'ALL']).default('ALL'),
      includeSpam: z.boolean().default(false),
    }).optional())
    .query(async ({ ctx, input }) => {
      const statusFilter = input?.status && input.status !== 'ALL' ? { status: input.status as any } : {};
      const spamFilter = input?.includeSpam ? {} : { isSpam: false };

      const tickets = await ctx.prisma.supportTicket.findMany({
        where: {
          ...statusFilter,
          ...spamFilter,
        },
        include: {
          user: { 
            select: { 
              name: true, 
              email: true, 
              role: true,
              subscription: {
                select: {
                  status: true,
                  plan: { select: { name: true, price: true } }
                }
              }
            } 
          },
          replies: {
            include: { user: { select: { name: true, email: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
      return tickets;
    }),

  // Admin: list spam tickets
  listSpamTickets: adminProcedure.query(async ({ ctx }) => {
    const tickets = await ctx.prisma.supportTicket.findMany({
      where: { isSpam: true },
      include: {
        user: { 
          select: { 
            name: true, 
            email: true, 
            role: true,
            subscription: {
              select: {
                status: true,
                plan: { select: { name: true, price: true } }
              }
            }
          } 
        },
        replies: {
          include: { user: { select: { name: true, email: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return tickets;
  }),

  // Admin: mark ticket as spam
  markAsSpam: adminProcedure
    .input(z.object({ 
      ticketId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.supportTicket.update({
        where: { id: input.ticketId },
        data: { 
          isSpam: true,
          spamScore: 100,
          spamReason: input.reason || 'Manually marked as spam by admin',
        },
      });
      return { success: true };
    }),

  // Admin: mark ticket as not spam
  markAsNotSpam: adminProcedure
    .input(z.object({ ticketId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.supportTicket.update({
        where: { id: input.ticketId },
        data: { 
          isSpam: false,
          spamScore: 0,
          spamReason: null,
        },
      });
      return { success: true };
    }),

  // Admin: get stats (excluding spam)
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [open, answered, closed, total, spam] = await Promise.all([
      ctx.prisma.supportTicket.count({ where: { status: 'OPEN', isSpam: false } }),
      ctx.prisma.supportTicket.count({ where: { status: 'ANSWERED', isSpam: false } }),
      ctx.prisma.supportTicket.count({ where: { status: 'CLOSED', isSpam: false } }),
      ctx.prisma.supportTicket.count({ where: { isSpam: false } }),
      ctx.prisma.supportTicket.count({ where: { isSpam: true } }),
    ]);
    return { open, answered, closed, total, spam };
  }),
});
