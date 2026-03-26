import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = '/app/backups';
const PROJECT_ROOT = '/app';
const DB_URL = process.env.DATABASE_URL || 'postgresql://rankseo:dev_password@localhost:5432/rankseo';
const CHUNK_SIZE_MB = 150;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export async function createBackup(): Promise<{
  success: boolean;
  backupId: string;
  files: string[];
  error?: string;
}> {
  const timestamp = getTimestamp();
  const backupId = `backup_${timestamp}`;
  const backupSubDir = path.join(BACKUP_DIR, backupId);

  console.log(`📦 Starting backup: ${backupId}`);

  try {
    fs.mkdirSync(backupSubDir, { recursive: true });

    // Step 1: Database dump
    const dbDumpPath = path.join(backupSubDir, 'database.sql');
    console.log('📦 Dumping database...');
    execSync(`pg_dump "${DB_URL}" > "${dbDumpPath}"`, { timeout: 120000 });

    // Step 2: Source code archive (WITHOUT screenshots — small file)
    const codePath = path.join(backupSubDir, `${backupId}_code.tar.gz`);
    console.log('📦 Archiving DB + source code...');
    execSync(
      `cd "${PROJECT_ROOT}" && tar czf "${codePath}" ` +
      `--exclude='node_modules' --exclude='.git' --exclude='.next' ` +
      `--exclude='postgresql-data' --exclude='backups' --exclude='.emergent' ` +
      `--exclude='yarn.lock' --exclude='public/screenshots' ` +
      `app/ lib/ prisma/ components/ public/ scripts/ hooks/ types/ docs/ ` +
      `package.json tsconfig.json next.config.js tailwind.config.js postcss.config.js jsconfig.json ` +
      `components.json .env 2>/dev/null || true`,
      { timeout: 300000 }
    );
    // Append the DB dump into the code archive temp
    const codeTempDir = path.join(backupSubDir, 'code_tmp');
    fs.mkdirSync(codeTempDir, { recursive: true });
    fs.copyFileSync(dbDumpPath, path.join(codeTempDir, 'database.sql'));
    execSync(`cd "${backupSubDir}" && tar rf "${codePath}" -C "${codeTempDir}" database.sql 2>/dev/null || true`, { timeout: 60000 });
    execSync(`rm -rf "${codeTempDir}"`);

    const createdFiles: string[] = [`${backupId}_code.tar.gz`];

    // Step 3: Screenshots archive — split into chunks if large
    const screenshotsDir = path.join(PROJECT_ROOT, 'public/screenshots');
    if (fs.existsSync(screenshotsDir)) {
      const screenshotsArchive = path.join(backupSubDir, `${backupId}_screenshots.tar.gz`);
      console.log('📦 Archiving screenshots/tutorials...');
      execSync(`cd "${PROJECT_ROOT}" && tar czf "${screenshotsArchive}" public/screenshots/`, { timeout: 600000 });

      const screenshotSize = fs.statSync(screenshotsArchive).size;
      const chunkSizeBytes = CHUNK_SIZE_MB * 1024 * 1024;

      if (screenshotSize > chunkSizeBytes) {
        // Split into chunks
        console.log(`📦 Splitting screenshots (${(screenshotSize / 1024 / 1024).toFixed(0)} MB) into ${CHUNK_SIZE_MB}MB chunks...`);
        execSync(`cd "${backupSubDir}" && split -b ${CHUNK_SIZE_MB}m "${screenshotsArchive}" "${backupId}_screenshots.tar.gz.part_"`, { timeout: 300000 });
        fs.unlinkSync(screenshotsArchive);

        const parts = fs.readdirSync(backupSubDir).filter(f => f.includes('_screenshots.tar.gz.part_')).sort();
        createdFiles.push(...parts);
        console.log(`📦 Split into ${parts.length} parts`);
      } else {
        createdFiles.push(`${backupId}_screenshots.tar.gz`);
      }
    }

    // Cleanup DB dump file (it's inside code archive now)
    if (fs.existsSync(dbDumpPath)) fs.unlinkSync(dbDumpPath);

    // Save metadata
    const fileSizes: Record<string, number> = {};
    for (const f of createdFiles) {
      const fp = path.join(backupSubDir, f);
      if (fs.existsSync(fp)) fileSizes[f] = fs.statSync(fp).size;
    }
    fs.writeFileSync(path.join(backupSubDir, 'metadata.json'), JSON.stringify({
      timestamp: new Date().toISOString(),
      backupId,
      files: createdFiles,
      fileSizes,
    }, null, 2));

    console.log(`📦 Backup complete: ${backupId} (${createdFiles.length} files)`);
    cleanupOldBackups(30);

    return { success: true, backupId, files: createdFiles };
  } catch (error: any) {
    console.error('❌ Backup failed:', error.message);
    try { execSync(`rm -rf "${backupSubDir}"`); } catch {}
    return { success: false, backupId: '', files: [], error: error.message };
  }
}

export interface BackupInfo {
  backupId: string;
  date: string;
  files: Array<{ name: string; size: number; sizeFormatted: string }>;
  totalSize: number;
  totalSizeFormatted: string;
}

export function listBackups(): BackupInfo[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const dirs = fs.readdirSync(BACKUP_DIR)
    .filter(d => {
      const p = path.join(BACKUP_DIR, d);
      return d.startsWith('backup_') && fs.statSync(p).isDirectory();
    })
    .sort()
    .reverse();

  return dirs.map(d => {
    const dirPath = path.join(BACKUP_DIR, d);
    const metaPath = path.join(dirPath, 'metadata.json');

    let date: string;
    try {
      const parts = d.replace('backup_', '');
      const [datePart, timePart] = parts.split('T');
      const timeFixed = timePart ? timePart.replace(/-/g, ':') : '00:00:00';
      date = new Date(`${datePart}T${timeFixed}Z`).toISOString();
    } catch {
      date = fs.statSync(dirPath).mtime.toISOString();
    }

    const allFiles = fs.readdirSync(dirPath).filter(f => f !== 'metadata.json');
    const files = allFiles.map(f => {
      const fp = path.join(dirPath, f);
      const size = fs.statSync(fp).size;
      const sizeMB = size / 1024 / 1024;
      return {
        name: f,
        size,
        sizeFormatted: sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`,
      };
    });

    const totalSize = files.reduce((a, f) => a + f.size, 0);
    const totalMB = totalSize / 1024 / 1024;

    return {
      backupId: d,
      date,
      files,
      totalSize,
      totalSizeFormatted: totalMB >= 1024 ? `${(totalMB / 1024).toFixed(2)} GB` : `${totalMB.toFixed(1)} MB`,
    };
  });
}

export function getBackupFilePath(backupId: string, filename: string): string | null {
  const filePath = path.join(BACKUP_DIR, backupId, filename);
  if (!filePath.startsWith(BACKUP_DIR) || !fs.existsSync(filePath)) return null;
  return filePath;
}

export async function restoreBackup(backupId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const backupPath = path.join(BACKUP_DIR, backupId);

  if (!fs.existsSync(backupPath) || !fs.statSync(backupPath).isDirectory()) {
    return { success: false, message: 'Backup not found' };
  }

  try {
    const files = fs.readdirSync(backupPath);

    // Step 1: Find and restore code archive (contains DB dump)
    const codeFile = files.find(f => f.endsWith('_code.tar.gz'));
    if (codeFile) {
      console.log('🔄 Restoring source code...');
      execSync(`cd "${PROJECT_ROOT}" && tar xzf "${path.join(backupPath, codeFile)}" --overwrite 2>/dev/null || true`, { timeout: 300000 });

      // Check if database.sql was extracted at root
      const dbDumpPath = path.join(PROJECT_ROOT, 'database.sql');
      if (fs.existsSync(dbDumpPath)) {
        console.log('🔄 Restoring database...');
        execSync(`psql "${DB_URL}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`, { timeout: 60000 });
        execSync(`psql "${DB_URL}" < "${dbDumpPath}"`, { timeout: 120000 });
        fs.unlinkSync(dbDumpPath);
        console.log('🔄 Database restored');
      }
    }

    // Step 2: Restore screenshots
    const screenshotFile = files.find(f => f.includes('_screenshots.tar.gz') && !f.includes('.part_'));
    const partFiles = files.filter(f => f.includes('_screenshots.tar.gz.part_')).sort();

    if (partFiles.length > 0) {
      // Reassemble parts
      const reassembled = path.join(backupPath, 'screenshots_reassembled.tar.gz');
      console.log(`🔄 Reassembling ${partFiles.length} screenshot parts...`);
      const partPaths = partFiles.map(f => `"${path.join(backupPath, f)}"`).join(' ');
      execSync(`cat ${partPaths} > "${reassembled}"`, { timeout: 300000 });
      execSync(`cd "${PROJECT_ROOT}" && tar xzf "${reassembled}" --overwrite`, { timeout: 600000 });
      fs.unlinkSync(reassembled);
      console.log('🔄 Screenshots restored');
    } else if (screenshotFile) {
      console.log('🔄 Restoring screenshots...');
      execSync(`cd "${PROJECT_ROOT}" && tar xzf "${path.join(backupPath, screenshotFile)}" --overwrite`, { timeout: 600000 });
      console.log('🔄 Screenshots restored');
    }

    console.log(`✅ Restore complete from: ${backupId}`);
    return { success: true, message: `Successfully restored from ${backupId}. Server restart may be required.` };
  } catch (error: any) {
    console.error('❌ Restore failed:', error.message);
    return { success: false, message: `Restore failed: ${error.message}` };
  }
}

export function deleteBackup(backupId: string): boolean {
  const dirPath = path.join(BACKUP_DIR, backupId);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    execSync(`rm -rf "${dirPath}"`);
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
        execSync(`rm -rf "${path.join(BACKUP_DIR, b.backupId)}"`);
        console.log(`🗑️ Deleted old backup: ${b.backupId}`);
      } catch {}
    }
  }
}
