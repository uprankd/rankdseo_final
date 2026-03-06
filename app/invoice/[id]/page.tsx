import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { InvoicePageClient } from './client';

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!transaction) notFound();

  let plan = null;
  if (transaction.planId) {
    plan = await prisma.plan.findUnique({
      where: { id: transaction.planId },
      select: { id: true, name: true, price: true },
    });
  }

  const date = new Date(transaction.createdAt);
  const invoiceNumber = `INV-${date.getFullYear()}-${transaction.id.slice(-6).toUpperCase()}`;
  const isLifetime = plan?.name?.toLowerCase().includes('lifetime') || false;

  const invoiceData = {
    invoiceNumber,
    date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    status: transaction.status,
    customer: {
      name: transaction.user?.name || 'Customer',
      email: transaction.user?.email || '',
    },
    items: [
      {
        description: `${plan?.name || 'Subscription'} Plan`,
        detail: isLifetime
          ? 'One-time payment — Lifetime access to Uprankd'
          : 'Monthly subscription — Uprankd backlink platform',
        amount: transaction.amount,
      },
    ],
    subtotal: transaction.amount,
    total: transaction.amount,
    currency: transaction.currency || 'usd',
    paymentMethod: transaction.paymentMethod || 'stripe',
    transactionId: transaction.paymentIntent || transaction.sessionId || transaction.id,
  };

  return <InvoicePageClient data={invoiceData} />;
}
