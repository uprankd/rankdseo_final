'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Calendar, Clock, FileText, Loader2, ChevronDown } from 'lucide-react';

export default function ActivityLogPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formPublished, setFormPublished] = useState(true);

  const utils = trpc.useUtils();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = trpc.admin.listUpdateLogs.useInfiniteQuery(
    { limit: 10, status: 'ALL' },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const createMutation = trpc.admin.createUpdateLog.useMutation({
    onSuccess: () => {
      toast.success('Entry added');
      resetForm();
      utils.admin.listUpdateLogs.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateUpdateLog.useMutation({
    onSuccess: () => {
      toast.success('Entry updated');
      resetForm();
      utils.admin.listUpdateLogs.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteUpdateLog.useMutation({
    onSuccess: () => {
      toast.success('Entry deleted');
      utils.admin.listUpdateLogs.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const logs = data?.pages.flatMap((p) => p.logs) || [];

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setFormPublished(true);
  };

  const handleEdit = (log: any) => {
    setEditingId(log.id);
    setFormDate(new Date(log.date).toISOString().split('T')[0]);
    setFormDescription(log.description);
    setFormPublished(log.status === 'PUBLISHED');
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formDescription.trim()) {
      toast.error('Description is required');
      return;
    }
    const payload = {
      date: formDate,
      description: formDescription.trim(),
      status: formPublished ? 'PUBLISHED' as const : 'DRAFT' as const,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6" data-testid="activity-log-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">Manual updates to show the site is active and maintained</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-gradient-to-r from-navy-500 to-sky-500"
          data-testid="add-entry-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="border-2 border-sky-200 shadow-lg" data-testid="entry-form">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{editingId ? 'Edit Entry' : 'New Entry'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
              <div>
                <Label htmlFor="log-date" className="text-sm font-semibold">Date</Label>
                <Input
                  id="log-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  data-testid="entry-date-input"
                />
              </div>
              <div>
                <Label htmlFor="log-desc" className="text-sm font-semibold">Description</Label>
                <Input
                  id="log-desc"
                  placeholder='e.g. "Added 15 new SEO guides to the database."'
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  data-testid="entry-description-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formPublished}
                  onCheckedChange={setFormPublished}
                  data-testid="entry-status-toggle"
                />
                <Label className="text-sm">
                  {formPublished ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">Draft</Badge>
                  )}
                </Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm} data-testid="cancel-entry-btn">Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSaving} data-testid="save-entry-btn">
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? 'Update' : 'Add Entry'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No entries yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "New Entry" to add your first update</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative" data-testid="activity-timeline">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-1">
            {logs.map((log: any) => {
              const dateStr = new Date(log.date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              });
              const isDraft = log.status === 'DRAFT';

              return (
                <div key={log.id} className={`relative flex items-start gap-4 pl-10 py-3 group rounded-lg hover:bg-gray-50 transition-colors ${isDraft ? 'opacity-60' : ''}`} data-testid={`log-entry-${log.id}`}>
                  {/* Timeline dot */}
                  <div className={`absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 border-white shadow ${isDraft ? 'bg-gray-400' : 'bg-sky-500'}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateStr}
                      </span>
                      {isDraft && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Draft</Badge>}
                    </div>
                    <p className="text-sm text-gray-800 font-medium">{log.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(log)} data-testid={`edit-log-${log.id}`}>
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:text-red-600"
                      onClick={() => { if (confirm('Delete this entry?')) deleteMutation.mutate({ id: log.id }); }}
                      data-testid={`delete-log-${log.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                data-testid="load-more-logs-btn"
              >
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
