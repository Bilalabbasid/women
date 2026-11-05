export interface RetentionOption {
  days: number;
  label: string;
  description: string;
  isDefault?: boolean;
}

export const RETENTION_POLICIES = {
  options: [
    {
      days: 7,
      label: '7 Days',
      description: 'Records automatically and permanently purge from cloud 7 days after entry.',
    },
    {
      days: 14,
      label: '14 Days',
      description: 'Two-week rolling retention window.',
    },
    {
      days: 30,
      label: '30 Days',
      description: 'Monthly cycle retention. Recommended for tracking one full menstrual/treatment cycle.',
      isDefault: true,
    },
    {
      days: 60,
      label: '60 Days',
      description: 'Two months of rolling cloud backup.',
    },
    {
      days: 90,
      label: '90 Days',
      description: 'Quarterly window. Ideal for comparing 3-month appointment intervals.',
    },
  ] as RetentionOption[],

  storageModes: [
    {
      id: 'device_only',
      title: 'Device Only (Default)',
      badge: 'Zero Cloud',
      description: 'Your health records reside exclusively in your browser/device IndexedDB. Nothing leaves this device.',
      warning: 'Clearing browser data or losing your device will permanently erase local records. Keep regular local backups.',
    },
    {
      id: 'temporary_cloud',
      title: 'Temporary Encrypted Cloud',
      badge: 'Auto-Purge',
      description: 'Records are encrypted on-device before transmission and automatically deleted on the server when the retention window expires.',
      warning: 'You control the expiration date. Hard deletion is executed automatically by our retention engine.',
    },
    {
      id: 'persistent_cloud',
      title: 'Persistent Encrypted Backup',
      badge: 'Encrypted Sync',
      description: 'End-to-end encrypted backup for multi-device sync and device recovery. The server never has the decryption key.',
      warning: 'Requires a secret recovery passphrase that only you hold.',
    },
  ],
} as const;
