// Kept so existing imports keep working; the backup format lives in lib/storage/backup.ts.
import { createBackup, downloadBackup, type BackupFile } from '../storage/backup';

export type ExportArchive = BackupFile;

export const ExportService = {
  generateFullExport: createBackup,
  async downloadJsonArchive(): Promise<void> {
    await downloadBackup();
  },
};
