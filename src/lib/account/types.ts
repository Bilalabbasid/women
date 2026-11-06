export type RetentionDays = 10 | 20 | 30 | 90;

export interface UserAccount {
  id: string;
  email: string;
  createdAt: string;
  status: 'active' | 'deleted';
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentVersion: string;
  consentedAt: string;
  purpose: 'server_sync' | 'ai_assistance';
  retentionDays: RetentionDays;
  withdrawnAt: string | null;
}

export interface StoredHealthRecord {
  id: string;
  userId: string;
  payload: string; // Encrypted JSON payload of symptom entries
  createdAt: string;
  expiresAt: string; // Dated expiry enforced by daily deletion job
}

export interface ConsentInput {
  userId: string;
  retentionDays: RetentionDays;
  consentVersion: string;
  purpose?: 'server_sync' | 'ai_assistance';
}

