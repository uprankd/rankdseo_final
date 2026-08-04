'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Flag, CheckCircle2, XCircle, Clock, Loader2, ExternalLink, ChevronDown, CheckSquare, Square } from 'lucide-react';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  RESOLVED: { label: 'Resolved', className: 'bg-green-100 text-green-700 border-green-200' },
  DISMISSED: { label: 'Dismissed', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const REASON_LABELS: Record<string, string> = {
  BROKEN_LINK: 'Broken Link',
  SITE_DOWN: 'Site Down',
  CONTENT_REMOVED: 'Content Removed',
  ACCESS_DENIED: 'Access Denied',
  OTHER: 'Other',
};

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const utils = trpc.useUtils();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = trpc.admin.listReports.useInfiniteQuery(
    { limit: 20, status: statusFilter as any },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const resolveMutation = trpc.admin.resolveReport.useMutation({
    onSuccess: (_, vars) => {
      if (vars && 'status' in vars) {
        toast.success(`Report ${vars.status === 'RESOLVED' ? 'resolved' : 'dismissed'}`);
      }
      utils.admin.listReports.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkResolveMutation = trpc.admin.bulkResolveReports.useMutation({
    onSuccess: (data, vars) => {
      if (vars && 'status' in vars) {
        toast.success(`${data.updated} reports ${vars.status === 'RESOLVED' ? 'resolved' : 'dismissed'}`);
      }
      setSelectedIds(new Set());
      utils.admin.listReports.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const reports = data?.pages.flatMap((p) => p.reports) || [];
  const counts = data?.pages[0]?.statusCounts || { PENDING: 0, RESOLVED: 0, DISMISSED: 0 };
  const totalReports = counts.PENDING + counts.RESOLVED + counts.DISMISSED;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reports.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(reports.map(r => r.id)));
  };

  return (
    <div className="space-y-6" data-testid="admin-reports-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Opportunity Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Manage reports from users about broken or inaccessible opportunities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', count: totalReports, icon: Flag, color: 'text-gray-700', bg: 'bg-gray-50', filter: 'ALL' },
          { label: 'Pending', count: counts.PENDING, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', filter: 'PENDING' },
          { label: 'Resolved', count: counts.RESOLVED, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', filter: 'RESOLVED' },
          { label: 'Dismissed', count: counts.DISMISSED, icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50', filter: 'DISMISSED' },
        ].map(stat => (
          <button
            key={stat.filter}
            onClick={() => { setStatusFilter(stat.filter); setSelectedIds(new Set()); }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${statusFilter === stat.filter ? 'border-sky-400 shadow-md' : 'border-gray-200 hover:border-gray-300'} ${stat.bg}`}
            data-testid={`filter-${stat.filter.toLowerCase()}`}
          >
            <stat.icon className={`h-5 w-5 ${stat.color} mb-1`} />
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-sky-50 border-2 border-sky-200 rounded-xl">
          <span className="text-sm font-semibold text-sky-700">{selectedIds.size} selected</span>
          <Button size="sm" className="bg-green-500 hover:bg-green-600" disabled={bulkResolveMutation.isPending}
            onClick={() => bulkResolveMutation.mutate({ ids: Array.from(selectedIds), status: 'RESOLVED' })} data-testid="bulk-resolve-btn">
            {bulkResolveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            Resolve
          </Button>
          <Button size="sm" variant="outline" disabled={bulkResolveMutation.isPending}
            onClick={() => bulkResolveMutation.mutate({ ids: Array.from(selectedIds), status: 'DISMISSED' })} data-testid="bulk-dismiss-btn">
            <XCircle className="h-4 w-4 mr-1" /> Dismiss
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* Reports List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Reports ({reports.length})</CardTitle>
            {reports.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleSelectAll} data-testid="select-all-reports-btn">
                {selectedIds.size === reports.length ? <><CheckSquare className="h-4 w-4 mr-1 text-sky-500" />Deselect All</> : <><Square className="h-4 w-4 mr-1" />Select All</>}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-sky-500" /></div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center">
              <Flag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{statusFilter === 'ALL' ? 'No reports yet' : `No ${statusFilter.toLowerCase()} reports`}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report: any) => {
                const style = STATUS_STYLES[report.status] || STATUS_STYLES.PENDING;
                return (
                  <div key={report.id} className="flex items-start gap-3 p-4 border-2 rounded-xl hover:border-gray-300 transition-colors" data-testid={`report-${report.id}`}>
                    {/* Checkbox */}
                    <button onClick={() => toggleSelect(report.id)} className="mt-1 flex-shrink-0 text-gray-400 hover:text-sky-500">
                      {selectedIds.has(report.id) ? <CheckSquare className="h-5 w-5 text-sky-500" /> : <Square className="h-5 w-5" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link href={`/opportunities/${report.opportunity.slug || report.opportunity.id}`} className="font-semibold text-sm text-navy-600 hover:underline">
                          {report.opportunity.siteName}
                        </Link>
                        <Badge className={style.className}>{style.label}</Badge>
                        <Badge variant="outline" className="text-xs">{REASON_LABELS[report.reason] || report.reason}</Badge>
                      </div>
                      {report.description && <p className="text-sm text-gray-600 mb-1">{report.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>by {report.user.name || report.user.email}</span>
                        <span>{new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <a href={report.opportunity.url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline flex items-center gap-1">
                          Visit site <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Actions */}
                    {report.status === 'PENDING' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 h-8" disabled={resolveMutation.isPending}
                          onClick={() => resolveMutation.mutate({ id: report.id, status: 'RESOLVED' })} data-testid={`resolve-${report.id}`}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
                        </Button>
                        <Button size="sm" variant="outline" className="h-8" disabled={resolveMutation.isPending}
                          onClick={() => resolveMutation.mutate({ id: report.id, status: 'DISMISSED' })} data-testid={`dismiss-${report.id}`}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} data-testid="load-more-reports-btn">
                {isFetchingNextPage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
