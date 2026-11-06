import { describe, it, expect, beforeEach } from 'vitest';
import { ExportService } from '@/lib/export/export-data';
import { LocalDataService } from '@/lib/db/service';

describe('ExportService Archive Generator', () => {
  beforeEach(async () => {
    await LocalDataService.purgeAllData();
  });

  it('generates a well-structured JSON export archive with version metadata', async () => {
    await LocalDataService.saveCheckin({
      date: '2026-10-02',
      overallFeeling: 4,
      symptoms: [
        {
          symptomId: 'waking_early',
          name: 'Night Waking',
          category: 'sleep',
          severity: 3,
        },
      ],
    });

    const archive = await ExportService.generateFullExport();

    expect(archive.formatVersion).toBe(2);
    expect(archive.format).toBe('menoverdict-backup');
    expect(archive.app).toBe('MenoVerdict');
    expect(archive.exportedAt).toBeDefined();
    expect(archive.schemaVersion).toBeGreaterThanOrEqual(2);
    expect(archive.data.checkins.length).toBe(1);
    expect(archive.data.symptoms.length).toBe(1);
    expect(archive.data.toolRecords).toEqual([]);
    expect(archive.privacyNotice).toContain('health records');
  });
});
