// Export Engine for MenoWell
// Generates user-controlled, client-side portable health archive.

import { db } from '../db/db';
import { APP_CONFIG } from '../config/constants';

export interface ExportArchive {
  formatVersion: 1;
  app: string;
  appVersion: string;
  exportedAt: string;
  privacyNotice: string;
  data: {
    checkins: unknown[];
    symptoms: unknown[];
    journal: unknown[];
    customSymptoms: unknown[];
    cycles: unknown[];
    treatments: unknown[];
    treatmentEvents: unknown[];
    appointments: unknown[];
    settings: unknown[];
  };
}

export const ExportService = {
  async generateFullExport(): Promise<ExportArchive> {
    const [
      checkins,
      symptoms,
      journal,
      customSymptoms,
      cycles,
      treatments,
      treatmentEvents,
      appointments,
      settings,
    ] = await Promise.all([
      db.checkins.toArray(),
      db.symptoms.toArray(),
      db.journal.toArray(),
      db.customSymptoms.toArray(),
      db.cycles.toArray(),
      db.treatments.toArray(),
      db.treatmentEvents.toArray(),
      db.appointments.toArray(),
      db.settings.toArray(),
    ]);

    return {
      formatVersion: 1,
      app: APP_CONFIG.name,
      appVersion: APP_CONFIG.version,
      exportedAt: new Date().toISOString(),
      privacyNotice:
        'This export contains your self-reported personal health journal. Keep this file secure on your personal device.',
      data: {
        checkins,
        symptoms,
        journal,
        customSymptoms,
        cycles,
        treatments,
        treatmentEvents,
        appointments,
        settings,
      },
    };
  },

  async downloadJsonArchive(): Promise<void> {
    const archive = await this.generateFullExport();
    const jsonStr = JSON.stringify(archive, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];

    const a = document.createElement('a');
    a.href = url;
    a.download = `menowell_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
