import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBackupFilePath } from '@/lib/jobs/backup';
import * as fs from 'fs';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backupId = request.nextUrl.searchParams.get('backupId');
  const filename = request.nextUrl.searchParams.get('filename');

  if (!backupId || !filename) {
    return NextResponse.json({ error: 'Missing backupId or filename' }, { status: 400 });
  }

  const filePath = getBackupFilePath(backupId, filename);
  if (!filePath) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const stats = fs.statSync(filePath);
  const stream = fs.createReadStream(filePath);

  const webStream = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(chunk));
      stream.on('end', () => controller.close());
      stream.on('error', (err) => controller.error(err));
    },
  });

  return new Response(webStream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': stats.size.toString(),
    },
  });
}
