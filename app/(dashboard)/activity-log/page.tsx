'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function UserActivityLogPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = trpc.opportunity.listUpdateLogs.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const logs = data?.pages.flatMap((p) => p.logs) || [];

  return (
    <div className="space-y-6" data-testid="user-activity-log-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recent Updates</h1>
          <p className="text-sm text-gray-500 mt-1">Latest changes and additions to the platform</p>
        </div>
        {isAdmin && (
          <Link href="/admin/activity-log">
            <Button variant="outline" size="sm" data-testid="manage-entries-btn">
              Manage Entries
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No updates yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative" data-testid="updates-timeline">
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-1">
            {logs.map((log: any) => {
              const dateStr = new Date(log.date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              });
              return (
                <div key={log.id} className="relative flex items-start gap-4 pl-10 py-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid={`update-entry-${log.id}`}>
                  <div className="absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 border-white shadow bg-sky-500" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mb-0.5">
                      <Calendar className="h-3 w-3" />
                      {dateStr}
                    </span>
                    <p className="text-sm text-gray-800 font-medium">{log.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} data-testid="load-more-updates-btn">
                {isFetchingNextPage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
