'use client';

import { useState, useRef } from 'react';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  FileText,
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Mail,
  Eye,
  Download,
  ArrowLeft,
  Filter,
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { InvoiceA4 } from '@/components/InvoiceA4';

export default function AdminInvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { data: invoicesData, isLoading, refetch } = trpc.admin.listInvoices.useQuery({
    limit: 50,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: stats } = trpc.admin.getInvoiceStats.useQuery();

  const resendInvoice = trpc.admin.resendInvoice.useMutation({
    onSuccess: (data) => {
      toast.success(`Invoice sent to ${data.email}`);
    },
    onError: (error) => {
      toast.error(`Failed to send invoice: ${error.message}`);
    },
  });

  const handleResendInvoice = (transactionId: string) => {
    resendInvoice.mutate({ transactionId });
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return (
          <span data-testid="status-badge-paid" className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" /> Paid
          </span>
        );
      case 'PENDING':
        return (
          <span data-testid="status-badge-pending" className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'FAILED':
        return (
          <span data-testid="status-badge-failed" className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        );
      case 'REFUNDED':
        return (
          <span data-testid="status-badge-refunded" className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            <RefreshCw className="h-3 w-3" /> Refunded
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const generateInvoiceNumber = (transaction: any) => {
    const date = new Date(transaction.createdAt);
    return `INV-${date.getFullYear()}-${transaction.id.slice(-6).toUpperCase()}`;
  };

  const buildInvoiceData = (transaction: any) => {
    const planName = transaction.plan?.name || 'Subscription';
    const isLifetime = planName.toLowerCase().includes('lifetime');

    return {
      invoiceNumber: generateInvoiceNumber(transaction),
      date: formatDateShort(transaction.createdAt),
      status: transaction.status,
      customer: {
        name: transaction.user?.name || 'Customer',
        email: transaction.user?.email || '',
      },
      items: [
        {
          description: `${planName} Plan`,
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
  };

  return (
    <>
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-a4-page, .invoice-a4-page * { visibility: visible !important; }
          .invoice-a4-page {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 20mm 18mm !important;
            box-shadow: none !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon" className="border-2" data-testid="back-to-admin-btn">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Invoice Management
            </h1>
            <p className="text-gray-600 text-sm">View and manage all payment invoices</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="invoice-stats-grid">
            <Card className="border-2 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="total-revenue">
                      {formatCurrency(stats.totalRevenue)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="month-revenue">
                      {formatCurrency(stats.thisMonthRevenue)}
                    </p>
                    {stats.monthlyGrowth !== 0 && (
                      <p className={`text-xs ${stats.monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.monthlyGrowth > 0 ? '↑' : '↓'} {Math.abs(stats.monthlyGrowth)}% vs last month
                      </p>
                    )}
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="total-transactions">
                      {stats.totalTransactions}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="success-rate">
                      {stats.successRate}%
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    data-testid="invoice-search-input"
                    placeholder="Search by email, name, or invoice ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 border-2 h-11"
                  />
                </div>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-2 h-11" data-testid="invoice-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SUCCEEDED">Paid</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  type="date"
                  placeholder="From date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border-2 h-11"
                  data-testid="invoice-date-from"
                />
              </div>
              <div>
                <Input
                  type="date"
                  placeholder="To date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border-2 h-11"
                  data-testid="invoice-date-to"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoices ({invoicesData?.totalCount || 0})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="refresh-invoices-btn">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Loading invoices...</p>
              </div>
            ) : invoicesData?.transactions.length === 0 ? (
              <div className="text-center py-8" data-testid="no-invoices-message">
                <FileText className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-2 text-gray-500">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoicesData?.transactions.map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`invoice-row-${transaction.id}`}>
                        <TableCell className="font-mono text-sm">
                          {generateInvoiceNumber(transaction)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.user?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{transaction.user?.email || 'No user'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                            {transaction.plan?.name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* A4 Invoice Preview Dialog */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" data-testid={`view-invoice-btn-${transaction.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[860px] max-h-[92vh] overflow-y-auto p-0">
                                <DialogHeader className="px-6 pt-5 pb-0">
                                  <div className="flex items-center justify-between">
                                    <DialogTitle className="text-lg">Invoice Preview</DialogTitle>
                                    <div className="flex gap-2 mr-8">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrintInvoice}
                                        data-testid="print-invoice-btn"
                                      >
                                        <Printer className="h-4 w-4 mr-1.5" />
                                        Print
                                      </Button>
                                      {transaction.receiptUrl && (
                                        <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer">
                                          <Button variant="outline" size="sm" data-testid="download-receipt-btn">
                                            <Download className="h-4 w-4 mr-1.5" />
                                            Stripe Receipt
                                          </Button>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </DialogHeader>
                                <div className="flex justify-center px-4 pb-6 pt-2">
                                  <div className="shadow-xl border border-gray-200 rounded-sm bg-white">
                                    <InvoiceA4
                                      ref={invoiceRef}
                                      data={buildInvoiceData(transaction)}
                                    />
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvoice(transaction.id)}
                              disabled={resendInvoice.isPending || !transaction.user}
                              title="Resend invoice email"
                              data-testid={`resend-invoice-btn-${transaction.id}`}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Summary */}
        {invoicesData?.statusCounts && Object.keys(invoicesData.statusCounts).length > 0 && (
          <Card className="border-2 shadow-lg" data-testid="invoice-status-summary">
            <CardHeader>
              <CardTitle>Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(invoicesData.statusCounts).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg"
                  >
                    {getStatusBadge(status)}
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
