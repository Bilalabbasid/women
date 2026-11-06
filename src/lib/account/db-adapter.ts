import type { UserAccount, ConsentRecord, StoredHealthRecord, RetentionDays, ConsentInput } from './types';

export interface DatabaseAdapter {
  createUser(email: string): Promise<UserAccount>;
  getUserById(id: string): Promise<UserAccount | null>;
  getUserByEmail(email: string): Promise<UserAccount | null>;
  deleteUser(id: string): Promise<void>;

  recordConsent(input: ConsentInput): Promise<ConsentRecord>;
  getLatestConsent(userId: string, purpose?: string): Promise<ConsentRecord | null>;
  withdrawConsent(userId: string, purpose?: string): Promise<void>;

  saveHealthRecord(userId: string, payload: string, retentionDays: RetentionDays): Promise<StoredHealthRecord>;
  getHealthRecords(userId: string): Promise<StoredHealthRecord[]>;
  deleteUserHealthRecords(userId: string): Promise<number>;
  deleteExpiredHealthRecords(now?: Date): Promise<number>;
}

export class MemoryDatabaseAdapter implements DatabaseAdapter {
  private users: Map<string, UserAccount> = new Map();
  private consents: ConsentRecord[] = [];
  private healthRecords: StoredHealthRecord[] = [];

  async createUser(email: string): Promise<UserAccount> {
    const existing = await this.getUserByEmail(email);
    if (existing) return existing;
    const user: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      email,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserById(id: string): Promise<UserAccount | null> {
    const u = this.users.get(id);
    return u && u.status === 'active' ? u : null;
  }

  async getUserByEmail(email: string): Promise<UserAccount | null> {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase() && u.status === 'active') return u;
    }
    return null;
  }

  async deleteUser(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.status = 'deleted';
    }
    // Withdrawing consent and deleting health records
    await this.withdrawConsent(id);
    await this.deleteUserHealthRecords(id);
  }

  async recordConsent(input: ConsentInput): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      id: `cns_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId: input.userId,
      consentVersion: input.consentVersion,
      consentedAt: new Date().toISOString(),
      purpose: input.purpose ?? 'server_sync',
      retentionDays: input.retentionDays,
      withdrawnAt: null,
    };
    this.consents.push(record);
    return record;
  }

  async getLatestConsent(userId: string, purpose = 'server_sync'): Promise<ConsentRecord | null> {
    const matches = this.consents
      .filter((c) => c.userId === userId && c.purpose === purpose && c.withdrawnAt === null)
      .sort((a, b) => b.consentedAt.localeCompare(a.consentedAt));
    return matches[0] ?? null;
  }

  async withdrawConsent(userId: string, purpose = 'server_sync'): Promise<void> {
    const now = new Date().toISOString();
    for (const c of this.consents) {
      if (c.userId === userId && c.purpose === purpose && c.withdrawnAt === null) {
        c.withdrawnAt = now;
      }
    }
    // Withdrawing consent automatically deletes stored health data
    if (purpose === 'server_sync') {
      await this.deleteUserHealthRecords(userId);
    }
  }

  async saveHealthRecord(userId: string, payload: string, retentionDays: RetentionDays): Promise<StoredHealthRecord> {
    const createdAtDate = new Date();
    const expiresAtDate = new Date(createdAtDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    const rec: StoredHealthRecord = {
      id: `hlth_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      payload,
      createdAt: createdAtDate.toISOString(),
      expiresAt: expiresAtDate.toISOString(),
    };
    this.healthRecords.push(rec);
    return rec;
  }

  async getHealthRecords(userId: string): Promise<StoredHealthRecord[]> {
    const now = new Date().toISOString();
    return this.healthRecords.filter((r) => r.userId === userId && r.expiresAt > now);
  }

  async deleteUserHealthRecords(userId: string): Promise<number> {
    const initial = this.healthRecords.length;
    this.healthRecords = this.healthRecords.filter((r) => r.userId !== userId);
    return initial - this.healthRecords.length;
  }

  async deleteExpiredHealthRecords(now: Date = new Date()): Promise<number> {
    const iso = now.toISOString();
    const initial = this.healthRecords.length;
    this.healthRecords = this.healthRecords.filter((r) => r.expiresAt > iso);
    return initial - this.healthRecords.length;
  }
}

// Global instance for local/test use
export const defaultDbAdapter = new MemoryDatabaseAdapter();
