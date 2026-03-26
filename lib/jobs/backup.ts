import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = '/app/backups';
const PROJECT_ROOT = '/app';
const DB_URL = process.env.DATABASE_URL || 'postgresql://rankseo:dev_password@localhost:5432/rankseo';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export async function createBackup(): Promise<{
  success: boolean;
  filename: string;
  size: number;
  error?: string;
}> {
  const timestamp = getTimestamp();
  const backupName = `backup_${timestamp}`;
  const tempDir = path.join(BACKUP_DIR, backupName);
  const archivePath = path.join(BACKUP_DIR, `${backupName}.tar.gz`);

  console.log(`📦 Starting backup: ${backupName}`);

  try {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });

    // Step 1: Database dump
    const dbDumpPath = path.join(tempDir, 'database.sql');
    console.log('📦 Dumping database...');
    execSync(`pg_dump "${DB_URL}" > "${dbDumpPath}"`, { timeout: 120000 });
    console.log('📦 Database dump complete');

    // Step 2: Archive source files (including screenshots/tutorials)
    const sourceArchive = path.join(tempDir, 'source.tar.gz');
    console.log('📦 Archiving source files + screenshots...');
    execSync(
      `cd "${PROJECT_ROOT}" && tar czf "${sourceArchive}" ` +
      `--exclude='node_modules' ` +
      `--exclude='.git' ` +
      `--exclude='.next' ` +
      `--exclude='postgresql-data' ` +
      `--exclude='backups' ` +
      `--exclude='.emergent' ` +
      `--exclude='yarn.lock' ` +
      `app/ lib/ prisma/ components/ public/ ` +
      `scripts/ hooks/ types/ docs/ ` +
      `package.json tsconfig.json next.config.js tailwind.config.js postcss.config.js jsconfig.json ` +
      `components.json .env 2>/dev/null || true`,
      { timeout: 600000 }
    );
    console.log('📦 Source archive complete');

    // Step 3: Save backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      name: backupName,
      dbSize: fs.statSync(dbDumpPath).size,
      sourceSize: fs.existsSync(sourceArchive) ? fs.statSync(sourceArchive).size : 0,
    };
    fs.writeFileSync(path.join(tempDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

    // Step 4: Create final archive
    console.log('📦 Creating final archive...');
    execSync(`cd "${BACKUP_DIR}" && tar czf "${archivePath}" "${backupName}/"`, { timeout: 120000 });

    // Cleanup temp directory
    execSync(`rm -rf "${tempDir}"`);

    const finalSize = fs.statSync(archivePath).size;
    console.log(`📦 Backup complete: ${backupName}.tar.gz (${(finalSize / 1024 / 1024).toFixed(2)} MB)`);

    // Cleanup old backups (keep last 30)
    cleanupOldBackups(30);

    return { success: true, filename: `${backupName}.tar.gz`, size: finalSize };
  } catch (error: any) {
    console.error('❌ Backup failed:', error.message);
    // Cleanup on failure
    try { execSync(`rm -rf "${tempDir}"`); } catch {}
    try { if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath); } catch {}
    return { success: false, filename: '', size: 0, error: error.message };
  }
}

export function listBackups(): Array<{
  filename: string;
  date: string;
  size: number;
  sizeFormatted: string;
}> {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.tar.gz'))
    .sort()
    .reverse();

  return files.map(f => {
    const stats = fs.statSync(path.join(BACKUP_DIR, f));
    // Extract date from filename: backup_2026-03-25T10-15-30.tar.gz
    const dateStr = f.replace('backup_', '').replace('.tar.gz', '').replace(/-/g, (m, i) => {
      // Restore ISO date format for parsing
      return i < 13 ? '-' : (i === 13 ? 'T' : ':');
    });
    let parsedDate: string;
    try {
      // Parse from filename format backup_YYYY-MM-DDTHH-MM-SS
      const parts = f.replace('backup_', '').replace('.tar.gz', '');
      const [datePart, timePart] = parts.split('T');
      const timeFixed = timePart ? timePart.replace(/-/g, ':') : '00:00:00';
      parsedDate = new Date(`${datePart}T${timeFixed}Z`).toISOString();
    } catch {
      parsedDate = stats.mtime.toISOString();
    }

    const sizeMB = stats.size / 1024 / 1024;
    return {
      filename: f,
      date: parsedDate,
      size: stats.size,
      sizeFormatted: sizeMB >= 1 ? `${sizeMB.toFixed(2)} MB` : `${(stats.size / 1024).toFixed(1)} KB`,
    };
  });
}

export async function restoreBackup(filename: string): Promise<{
  success: boolean;
  message: string;
}> {
  const archivePath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(archivePath)) {
    return { success: false, message: 'Backup file not found' };
  }

  const restoreDir = path.join(BACKUP_DIR, 'restore_temp');

  try {
    // Clean up any previous restore attempt
    execSync(`rm -rf "${restoreDir}"`);
    fs.mkdirSync(restoreDir, { recursive: true });

    // Extract archive
    console.log(`🔄 Extracting backup: ${filename}`);
    execSync(`cd "${BACKUP_DIR}" && tar xzf "${archivePath}" -C "${restoreDir}"`, { timeout: 120000 });

    // Find the extracted backup folder
    const extractedDirs = fs.readdirSync(restoreDir).filter(d =>
      fs.statSync(path.join(restoreDir, d)).isDirectory()
    );
    if (extractedDirs.length === 0) {
      throw new Error('No backup data found in archive');
    }
    const backupDataDir = path.join(restoreDir, extractedDirs[0]);

    // Step 1: Restore database
    const dbDumpPath = path.join(backupDataDir, 'database.sql');
    if (fs.existsSync(dbDumpPath)) {
      console.log('🔄 Restoring database...');
      // Drop and recreate to ensure clean restore
      execSync(`psql "${DB_URL}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`, { timeout: 60000 });
      execSync(`psql "${DB_URL}" < "${dbDumpPath}"`, { timeout: 120000 });
      console.log('🔄 Database restored');
    }

    // Step 2: Restore source files
    const sourceArchive = path.join(backupDataDir, 'source.tar.gz');
    if (fs.existsSync(sourceArchive)) {
      console.log('🔄 Restoring source files...');
      execSync(`cd "${PROJECT_ROOT}" && tar xzf "${sourceArchive}" --overwrite`, { timeout: 120000 });
      console.log('🔄 Source files restored');
    }

    // Cleanup
    execSync(`rm -rf "${restoreDir}"`);

    console.log(`✅ Restore complete from: ${filename}`);
    return { success: true, message: `Successfully restored from ${filename}. Server restart may be required.` };
  } catch (error: any) {
    console.error('❌ Restore failed:', error.message);
    try { execSync(`rm -rf "${restoreDir}"`); } catch {}
    return { success: false, message: `Restore failed: ${error.message}` };
  }
}

export function deleteBackup(filename: string): boolean {
  const filePath = path.join(BACKUP_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

function cleanupOldBackups(keepCount: number) {
  const backups = listBackups();
  if (backups.length > keepCount) {
    const toDelete = backups.slice(keepCount);
    for (const b of toDelete) {
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, b.filename));
        console.log(`🗑️ Deleted old backup: ${b.filename}`);
      } catch {}
    }
  }
}
