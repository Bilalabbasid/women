import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryDatabaseAdapter } from '@/lib/account/db-adapter';
import { AccountService } from '@/lib/account/service';

describe('Accounts, Consent and Data Retention (Prompt 2)', () => {
  let db: MemoryDatabaseAdapter;
  let service: AccountService;

  beforeEach(() => {
    db = new MemoryDatabaseAdapter();
    service = new AccountService(db);
  });

  it('creates user account holding only minimal auth data', async () => {
    const user = await service.createOrGetUser('reader@example.com');
    expect(user.id).toBeDefined();
    expect(user.email).toBe('reader@example.com');
    expect(user.status).toBe('active');
  });

  it('rejects saving health data without explicit consent', async () => {
    const user = await service.createOrGetUser('reader@example.com');
    await expect(
      service.syncHealthData(user.id, JSON.stringify({ symptom: 'hot_flashes', severity: 'moderate' }))
    ).rejects.toThrow('Explicit consent is required');
  });

  it('records consent with 10, 20, 30, or 90 days retention', async () => {
    const user = await service.createOrGetUser('reader@example.com');
    const consent = await service.recordSyncConsent(user.id, 30, 'v1.0-gdpr9');

    expect(consent.retentionDays).toBe(30);
    expect(consent.userId).toBe(user.id);
    expect(consent.withdrawnAt).toBeNull();

    const storedConsent = await service.getSyncConsent(user.id);
    expect(storedConsent?.id).toBe(consent.id);
  });

  it('saves health data with dated expiry after consent', async () => {
    const user = await service.createOrGetUser('reader@example.com');
    await service.recordSyncConsent(user.id, 10, 'v1.0-gdpr9');

    const record = await service.syncHealthData(user.id, JSON.stringify({ symptom: 'night_sweats', count: 2 }));
    expect(record.userId).toBe(user.id);
    expect(record.createdAt).toBeDefined();
    expect(record.expiresAt).toBeDefined();

    // Verify expiry is approximately 10 days in the future
    const createdTime = new Date(record.createdAt).getTime();
    const expiryTime = new Date(record.expiresAt).getTime();
    const diffDays = Math.round((expiryTime - createdTime) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(10);
  });

  it('automatically deletes expired records while keeping unexpired records', async () => {
    const user = await service.createOrGetUser('reader@example.com');
    await service.recordSyncConsent(user.id, 10, 'v1.0-gdpr9');

    await service.syncHealthData(user.id, JSON.stringify({ entry: 1 }));
    await service.syncHealthData(user.id, JSON.stringify({ entry: 2 }));

    // Advance simulated time by 5 days: nothing should be deleted yet
    const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const deletedEarly = await service.runScheduledDataDeletion(fiveDaysLater);
    expect(deletedEarly).toBe(0);

    const activeRecords = await service.getUserHealthData(user.id);
    expect(activeRecords.length).toBe(2);

    // Advance simulated time by 11 days: both 10-day records must be deleted
    const elevenDaysLater = new Date(Date.now() + 11 * 24 * 60 * 60 * 1000);
    const deletedExpired = await service.runScheduledDataDeletion(elevenDaysLater);
    expect(deletedExpired).toBe(2);

    const remaining = await service.getUserHealthData(user.id);
    expect(remaining.length).toBe(0);
  });

  it('withdrawing consent stops storage and immediately deletes all stored health data', async () => {
    const user = await service.createOrGetUser('reader@example.com');
    await service.recordSyncConsent(user.id, 90, 'v1.0-gdpr9');

    await service.syncHealthData(user.id, JSON.stringify({ symptom: 'joint_pain' }));
    let records = await service.getUserHealthData(user.id);
    expect(records.length).toBe(1);

    // Withdraw consent
    await service.withdrawSyncConsent(user.id);

    const consent = await service.getSyncConsent(user.id);
    expect(consent).toBeNull(); // active consent is gone

    records = await service.getUserHealthData(user.id);
    expect(records.length).toBe(0); // health records deleted

    // Future sync attempts fail
    await expect(service.syncHealthData(user.id, JSON.stringify({ symptom: 'fatigue' }))).rejects.toThrow(
      'Explicit consent is required'
    );
  });

  it('exports user data for data-subject requests', async () => {
    const user = await service.createOrGetUser('reader@example.com');
    await service.recordSyncConsent(user.id, 20, 'v1.0-gdpr9');
    await service.syncHealthData(user.id, JSON.stringify({ note: 'symptom note' }));

    const exportData = await service.exportUserData(user.id);
    expect(exportData.user?.email).toBe('reader@example.com');
    expect(exportData.consent?.retentionDays).toBe(20);
    expect(exportData.records.length).toBe(1);
    expect(exportData.exportedAt).toBeDefined();
  });

  it('deletes account completely including consents and health records', async () => {
    const user = await service.createOrGetUser('reader@example.com');
    await service.recordSyncConsent(user.id, 30, 'v1.0-gdpr9');
    await service.syncHealthData(user.id, JSON.stringify({ item: 'data' }));

    await service.deleteAccount(user.id);

    const checkUser = await db.getUserById(user.id);
    expect(checkUser).toBeNull();

    const checkConsent = await service.getSyncConsent(user.id);
    expect(checkConsent).toBeNull();

    const checkData = await service.getUserHealthData(user.id);
    expect(checkData.length).toBe(0);
  });
});

