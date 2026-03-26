import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = '/app/backups';

export async function GET(request: NextRequest) {
  // Auth check - admin only
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filename = request.nextUrl.searchParams.get('filename');
  if (!filename || !filename.startsWith('backup_') || !filename.endsWith('.tar.gz')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = path.join(BACKUP_DIR, filename);

  // Prevent path traversal
  if (!filePath.startsWith(BACKUP_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const stats = fs.statSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': stats.size.toString(),
    },
  });
}
