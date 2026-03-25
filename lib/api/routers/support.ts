import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

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
      const ticket = await ctx.prisma.supportTicket.create({
        data: {
          subject: input.subject,
          message: input.message,
          category: input.category,
          priority: input.priority,
          userId: ctx.user.id,
        },
      });
      return { id: ticket.id };
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

  // Admin: list all tickets
  listAllTickets: adminProcedure
    .input(z.object({
      status: z.enum(['OPEN', 'ANSWERED', 'CLOSED', 'ALL']).default('ALL'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const statusFilter = input?.status && input.status !== 'ALL' ? { status: input.status as any } : {};

      const tickets = await ctx.prisma.supportTicket.findMany({
        where: statusFilter,
        include: {
          user: { select: { name: true, email: true, role: true } },
          replies: {
            include: { user: { select: { name: true, email: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
      return tickets;
    }),

  // Admin: get stats
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [open, answered, closed, total] = await Promise.all([
      ctx.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      ctx.prisma.supportTicket.count({ where: { status: 'ANSWERED' } }),
      ctx.prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
      ctx.prisma.supportTicket.count(),
    ]);
    return { open, answered, closed, total };
  }),
});
