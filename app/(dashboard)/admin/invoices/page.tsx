'use client';

import { useState } from 'react';
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
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminInvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  // Fetch invoices
  const { data: invoicesData, isLoading, refetch } = trpc.admin.listInvoices.useQuery({
    limit: 50,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // Fetch stats
  const { data: stats } = trpc.admin.getInvoiceStats.useQuery();

  // Resend invoice mutation
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" /> Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
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

  const generateInvoiceNumber = (transaction: any) => {
    const date = new Date(transaction.createdAt);
    return `INV-${date.getFullYear()}-${transaction.id.slice(-6).toUpperCase()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="icon" className="border-2">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
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
                  <p className="text-2xl font-bold text-blue-600">
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
                  <p className="text-2xl font-bold text-purple-600">
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
                  <p className="text-2xl font-bold text-orange-600">
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
                  placeholder="Search by email, name, or invoice ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-2 h-11"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-2 h-11">
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
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border-2 h-11"
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
            <Button variant="outline" size="sm" onClick={() => refetch()}>
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
            <div className="text-center py-8">
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
                    <TableRow key={transaction.id}>
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Invoice Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                                  <p className="text-sm text-gray-600">Invoice Number</p>
                                  <p className="text-xl font-bold text-blue-600">
                                    {generateInvoiceNumber(transaction)}
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Customer</p>
                                    <p className="font-medium">{transaction.user?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">{transaction.user?.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="text-2xl font-bold text-green-600">
                                      {formatCurrency(transaction.amount, transaction.currency)}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Plan</p>
                                    <p className="font-medium">{transaction.plan?.name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    {getStatusBadge(transaction.status)}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-medium">{formatDate(transaction.createdAt)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Transaction ID</p>
                                    <p className="font-mono text-xs break-all">
                                      {transaction.paymentIntent || transaction.sessionId || transaction.id}
                                    </p>
                                  </div>
                                </div>

                                {transaction.receiptUrl && (
                                  <div>
                                    <a
                                      href={transaction.receiptUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download Stripe Receipt
                                    </a>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvoice(transaction.id)}
                            disabled={resendInvoice.isPending || !transaction.user}
                            title="Resend invoice email"
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
        <Card className="border-2 shadow-lg">
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
  );
}
