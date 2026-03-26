'use client';

import { useState } from 'react';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Download, RotateCcw, Trash2, Plus, Clock, Database, FileArchive, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBackupsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: backups, refetch } = trpc.admin.listBackups.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const createBackup = trpc.admin.createBackup.useMutation({
    onSuccess: (data) => {
      toast.success(`Backup created: ${data.filename}`);
      refetch();
      setIsCreating(false);
    },
    onError: (err) => {
      toast.error(`Backup failed: ${err.message}`);
      setIsCreating(false);
    },
  });

  const restoreBackup = trpc.admin.restoreBackup.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setRestoringFile(null);
      setConfirmRestore(null);
    },
    onError: (err) => {
      toast.error(`Restore failed: ${err.message}`);
      setRestoringFile(null);
      setConfirmRestore(null);
    },
  });

  const deleteBackup = trpc.admin.deleteBackup.useMutation({
    onSuccess: () => {
      toast.success('Backup deleted');
      refetch();
      setConfirmDelete(null);
    },
    onError: (err) => {
      toast.error(`Delete failed: ${err.message}`);
      setConfirmDelete(null);
    },
  });

  const handleCreate = () => {
    setIsCreating(true);
    createBackup.mutate();
  };

  const handleRestore = (filename: string) => {
    setRestoringFile(filename);
    restoreBackup.mutate({ filename });
  };

  const handleDownload = (filename: string) => {
    window.open(`/api/backups/download?filename=${encodeURIComponent(filename)}`, '_blank');
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const totalSize = backups?.reduce((acc, b) => acc + b.size, 0) || 0;
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);

  return (
    <div className="space-y-8" data-testid="admin-backups-page">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Backup Management</h1>
        <p className="text-gray-500 mt-1">Create, download, and restore project backups</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Backups</p>
                <p className="text-3xl font-bold text-gray-900">{backups?.length || 0}</p>
              </div>
              <Database className="h-10 w-10 text-blue-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Storage</p>
                <p className="text-3xl font-bold text-gray-900">{totalSizeMB} MB</p>
              </div>
              <HardDrive className="h-10 w-10 text-emerald-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Schedule</p>
                <p className="text-lg font-bold text-gray-900">Daily at 3:00 AM</p>
              </div>
              <Clock className="h-10 w-10 text-amber-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">All Backups</h2>
        <Button
          onClick={handleCreate}
          disabled={isCreating}
          className="bg-gradient-to-r from-navy-600 to-sky-500 text-white font-semibold"
          data-testid="create-backup-btn"
        >
          {isCreating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Backup...</>
          ) : (
            <><Plus className="h-4 w-4 mr-2" /> Create Backup Now</>
          )}
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <div className="flex items-start gap-2">
          <FileArchive className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">What&apos;s included in backups:</p>
            <p>Full database dump + source code (app, lib, prisma, components, scripts, config files). Screenshots are excluded to keep backups small. Backups auto-delete after 30 days.</p>
          </div>
        </div>
      </div>

      {/* Backup list */}
      {!backups || backups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No backups yet</p>
            <p className="text-gray-400 text-sm mt-1">Click &quot;Create Backup Now&quot; to make your first backup</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {backups.map((backup, index) => (
            <Card key={backup.filename} className={index === 0 ? 'border-emerald-300 bg-emerald-50/30' : ''}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${index === 0 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <FileArchive className={`h-5 w-5 ${index === 0 ? 'text-emerald-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{formatDate(backup.date)}</p>
                        {index === 0 && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Latest</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{backup.filename} &middot; {backup.sizeFormatted}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Download */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(backup.filename)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      data-testid={`download-backup-${index}`}
                    >
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>

                    {/* Restore */}
                    {confirmRestore === backup.filename ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRestore(backup.filename)}
                          disabled={restoringFile === backup.filename}
                          data-testid={`confirm-restore-${index}`}
                        >
                          {restoringFile === backup.filename ? (
                            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Restoring...</>
                          ) : (
                            <><CheckCircle className="h-4 w-4 mr-1" /> Confirm</>
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmRestore(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRestore(backup.filename)}
                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        data-testid={`restore-backup-${index}`}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" /> Restore
                      </Button>
                    )}

                    {/* Delete */}
                    {confirmDelete === backup.filename ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteBackup.mutate({ filename: backup.filename })}
                          data-testid={`confirm-delete-${index}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(backup.filename)}
                        className="text-red-500 hover:bg-red-50"
                        data-testid={`delete-backup-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Restore warning */}
      <Card className="border-amber-300 bg-amber-50/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Important: About Restoration</p>
              <p className="text-sm text-amber-700 mt-1">
                Restoring a backup will replace the current database and source files with the backup&apos;s version.
                This action cannot be undone. Always create a fresh backup before restoring an older one.
                After restoration, the server may need to restart automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
