import { DatabaseAdapter, defaultDbAdapter } from './db-adapter';
import type { RetentionDays, ConsentRecord, StoredHealthRecord, UserAccount } from './types';

export class AccountService {
  constructor(private db: DatabaseAdapter = defaultDbAdapter) {}

  async createOrGetUser(email: string): Promise<UserAccount> {
    return this.db.createUser(email);
  }

  async recordSyncConsent(userId: string, retentionDays: RetentionDays, consentVersion: string): Promise<ConsentRecord> {
    return this.db.recordConsent({
      userId,
      retentionDays,
      consentVersion,
      purpose: 'server_sync',
    });
  }

  async getSyncConsent(userId: string): Promise<ConsentRecord | null> {
    return this.db.getLatestConsent(userId, 'server_sync');
  }

  async withdrawSyncConsent(userId: string): Promise<void> {
    return this.db.withdrawConsent(userId, 'server_sync');
  }

  async syncHealthData(userId: string, payload: string): Promise<StoredHealthRecord> {
    const consent = await this.getSyncConsent(userId);
    if (!consent) {
      throw new Error('Explicit consent is required before saving or syncing health data to the server.');
    }
    return this.db.saveHealthRecord(userId, payload, consent.retentionDays);
  }

  async getUserHealthData(userId: string): Promise<StoredHealthRecord[]> {
    const consent = await this.getSyncConsent(userId);
    if (!consent) return [];
    return this.db.getHealthRecords(userId);
  }

  async deleteAllHealthData(userId: string): Promise<number> {
    return this.db.deleteUserHealthRecords(userId);
  }

  async deleteAccount(userId: string): Promise<void> {
    return this.db.deleteUser(userId);
  }

  async exportUserData(userId: string): Promise<{
    user: UserAccount | null;
    consent: ConsentRecord | null;
    records: StoredHealthRecord[];
    exportedAt: string;
  }> {
    const user = await this.db.getUserById(userId);
    const consent = await this.db.getLatestConsent(userId, 'server_sync');
    const records = consent ? await this.db.getHealthRecords(userId) : [];
    return {
      user,
      consent,
      records,
      exportedAt: new Date().toISOString(),
    };
  }

  async runScheduledDataDeletion(now?: Date): Promise<number> {
    return this.db.deleteExpiredHealthRecords(now);
  }
}

export const accountService = new AccountService();

