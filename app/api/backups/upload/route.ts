import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = '/app/backups';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.startsWith('backup_')) {
      return NextResponse.json({ error: 'Invalid backup file name.' }, { status: 400 });
    }

    // Extract backupId from filename (e.g., backup_2026-03-26T09-09-53_code.tar.gz -> backup_2026-03-26T09-09-53)
    const match = file.name.match(/^(backup_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
    if (!match) {
      return NextResponse.json({ error: 'Cannot parse backup ID from filename.' }, { status: 400 });
    }

    const backupId = match[1];
    const backupDir = path.join(BACKUP_DIR, backupId);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      backupId,
      filename: file.name,
      size: buffer.length,
    });
  } catch (error: any) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
