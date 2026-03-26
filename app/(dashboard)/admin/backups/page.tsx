'use client';

import { useState, useRef } from 'react';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Download, RotateCcw, Trash2, Plus, Clock, Database, FileArchive, Loader2, AlertTriangle, CheckCircle, Upload, File } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBackupsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: backups, refetch } = trpc.admin.listBackups.useQuery(undefined, { refetchInterval: 30000 });

  const createBackup = trpc.admin.createBackup.useMutation({
    onSuccess: () => {
      toast.success('Backup created successfully');
      refetch();
      setIsCreating(false);
    },
    onError: (err) => {
      toast.error(`Backup failed: ${err.message}`);
      setIsCreating(false);
    },
  });

  const restoreBackupMut = trpc.admin.restoreBackup.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setRestoringId(null);
      setConfirmRestore(null);
    },
    onError: (err) => {
      toast.error(`Restore failed: ${err.message}`);
      setRestoringId(null);
      setConfirmRestore(null);
    },
  });

  const deleteBackupMut = trpc.admin.deleteBackup.useMutation({
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

  const handleDownloadFile = (backupId: string, filename: string) => {
    window.open(`/api/backups/download?backupId=${encodeURIComponent(backupId)}&filename=${encodeURIComponent(filename)}`, '_blank');
  };

  const handleRestore = (backupId: string) => {
    setRestoringId(backupId);
    restoreBackupMut.mutate({ backupId });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.startsWith('backup_') || (!file.name.endsWith('.tar.gz') && !file.name.includes('.tar.gz.part_'))) {
      toast.error('Invalid file. Must be a backup file (backup_*.tar.gz or part file).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/backups/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      toast.success(`Backup uploaded: ${data.filename}`);
      refetch();
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const getFileIcon = (name: string) => {
    if (name.includes('_code')) return <Database className="h-4 w-4 text-blue-500" />;
    if (name.includes('_screenshots')) return <FileArchive className="h-4 w-4 text-purple-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const getFileLabel = (name: string) => {
    if (name.includes('_code.tar.gz')) return 'DB + Source Code';
    if (name.includes('.part_')) {
      const partMatch = name.match(/\.part_([a-z]+)$/);
      return `Screenshots Part ${partMatch ? partMatch[1].toUpperCase() : ''}`;
    }
    if (name.includes('_screenshots')) return 'Screenshots / Tutorials';
    return name;
  };

  const totalStorage = backups?.reduce((a, b) => a + b.totalSize, 0) || 0;
  const totalStorageMB = totalStorage / 1024 / 1024;
  const totalFormatted = totalStorageMB >= 1024 ? `${(totalStorageMB / 1024).toFixed(1)} GB` : `${totalStorageMB.toFixed(1)} MB`;

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
                <p className="text-3xl font-bold text-gray-900">{totalFormatted}</p>
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
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".tar.gz,.gz" className="hidden" data-testid="upload-backup-input" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} data-testid="upload-backup-btn">
            {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4 mr-2" /> Upload Backup</>}
          </Button>
          <Button onClick={handleCreate} disabled={isCreating} className="bg-gradient-to-r from-navy-600 to-sky-500 text-white font-semibold" data-testid="create-backup-btn">
            {isCreating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : <><Plus className="h-4 w-4 mr-2" /> Create Backup Now</>}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <div className="flex items-start gap-2">
          <FileArchive className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Backups are split into downloadable parts:</p>
            <p><strong>DB + Code</strong> (~1-2 MB) — database dump + all source code. <strong>Screenshots</strong> — split into 150 MB chunks for reliable downloads. To reassemble: <code className="bg-blue-100 px-1 rounded">cat *_screenshots.tar.gz.part_* &gt; screenshots.tar.gz</code></p>
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
        <div className="space-y-4">
          {backups.map((backup, index) => (
            <Card key={backup.backupId} className={index === 0 ? 'border-emerald-300 bg-emerald-50/30' : ''}>
              <CardContent className="py-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${index === 0 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <FileArchive className={`h-5 w-5 ${index === 0 ? 'text-emerald-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{formatDate(backup.date)}</p>
                        {index === 0 && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Latest</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{backup.files.length} files &middot; {backup.totalSizeFormatted}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Restore */}
                    {confirmRestore === backup.backupId ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="destructive" onClick={() => handleRestore(backup.backupId)} disabled={restoringId === backup.backupId} data-testid={`confirm-restore-${index}`}>
                          {restoringId === backup.backupId ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Restoring...</> : <><CheckCircle className="h-4 w-4 mr-1" /> Confirm</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmRestore(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setConfirmRestore(backup.backupId)} className="text-amber-600 border-amber-200 hover:bg-amber-50" data-testid={`restore-backup-${index}`}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Restore
                      </Button>
                    )}

                    {/* Delete */}
                    {confirmDelete === backup.backupId ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="destructive" onClick={() => deleteBackupMut.mutate({ backupId: backup.backupId })} data-testid={`confirm-delete-${index}`}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(backup.backupId)} className="text-red-500 hover:bg-red-50" data-testid={`delete-backup-${index}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* File list */}
                <div className="border-t pt-3 space-y-2">
                  {backup.files.map((file) => (
                    <div key={file.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.name)}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{getFileLabel(file.name)}</p>
                          <p className="text-xs text-gray-400">{file.name} &middot; {file.sizeFormatted}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadFile(backup.backupId, file.name)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        data-testid={`download-${file.name}`}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Warning */}
      <Card className="border-amber-300 bg-amber-50/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Important: About Restoration</p>
              <p className="text-sm text-amber-700 mt-1">
                Restoring replaces the current database and source files. This cannot be undone. Always create a fresh backup before restoring an older one.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
