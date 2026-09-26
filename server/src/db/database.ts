import { v4 as uuidv4 } from 'uuid';
import {
  User,
  PatientProfile,
  ScanResponse,
  ExtractionResultPayload,
  SafetyFlag,
  MedicineItem,
  SupportedLanguageCode,
  DocumentType,
  ScanStatus,
  OcrConfidenceLevel,
  UserRole,
  UserStatus,
  ConsentRecord,
  ShareGrant,
  Organization,
} from '../../../shared/types';

export interface UserEntity extends User {
  passwordHash?: string | null;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface OrganizationEntity extends Organization {
  sarvamEncryptedKey?: string | null;
  updatedAt: string;
}

export interface OrganizationMembershipEntity {
  id: string;
  organizationId: string;
  userId: string;
  orgRole: 'org_admin' | 'org_member';
  createdAt: string;
}

export interface PatientProfileEntity extends PatientProfile {
  deletedAt?: string | null;
}

export interface CaseloadAssignmentEntity {
  id: string;
  patientProfileId: string;
  orgMemberUserId: string;
  assignedAt: string;
}

export interface ScanEntity {
  id: string;
  patientProfileId: string;
  uploadedByUserId: string;
  documentType: DocumentType;
  status: ScanStatus;
  pageCount: number;
  targetLanguageCode: SupportedLanguageCode;
  sarvamKeySource: 'platform_pooled' | 'org_byok';
  failureReason?: string | null;
  createdAt: string;
  processingStartedAt?: string | null;
  processingCompletedAt?: string | null;
  sourceDeletedAt?: string | null;
}

export interface ScanPageEntity {
  id: string;
  scanId: string;
  pageNumber: number;
  s3ObjectKey: string;
  contentHash: string;
  createdAt: string;
}

export interface ExtractionResultEntity {
  id: string;
  scanId: string;
  medicines: MedicineItem[];
  plainExplanationEn: string;
  translatedExplanation: string | null;
  safetyFlags: SafetyFlag[];
  ocrConfidence: OcrConfidenceLevel;
  audioS3Key: string | null;
  sarvamRequestIds: Record<string, string>;
  promptVersion: string;
  createdAt: string;
}

export interface ConsentRecordEntity extends ConsentRecord {
  ipAddress: string;
}

export interface ShareGrantEntity {
  id: string;
  scanId: string;
  grantedByUserId: string;
  grantedToUserId?: string | null;
  inviteTokenHash: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface UsageCounterEntity {
  id: string;
  subjectType: 'user' | 'organization';
  subjectId: string;
  periodStart: string;
  scansUsed: number;
  planScanLimit: number;
  updatedAt: string;
}

export interface AuditLogEntity {
  id: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeState?: any;
  afterState?: any;
  timestamp: string;
  ipAddress?: string;
}

export class Database {
  users = new Map<string, UserEntity>();
  organizations = new Map<string, OrganizationEntity>();
  memberships = new Map<string, OrganizationMembershipEntity>();
  patientProfiles = new Map<string, PatientProfileEntity>();
  caseloadAssignments = new Map<string, CaseloadAssignmentEntity>();
  scans = new Map<string, ScanEntity>();
  scanPages = new Map<string, ScanPageEntity>();
  extractionResults = new Map<string, ExtractionResultEntity>();
  consentRecords: ConsentRecordEntity[] = [];
  shareGrants = new Map<string, ShareGrantEntity>();
  usageCounters = new Map<string, UsageCounterEntity>();
  auditLogs: AuditLogEntity[] = [];
  supportJustifications = new Map<string, any>();

  // Mutex for atomic quota reservation (Section 4.8 / 5.7)
  private quotaMutex = Promise.resolve();

  constructor() {
    this.seedSyntheticErasedUser();
  }

  private seedSyntheticErasedUser(): void {
    const erasedUserId = '00000000-0000-0000-0000-000000000000';
    if (!this.users.has(erasedUserId)) {
      this.users.set(erasedUserId, {
        id: erasedUserId,
        displayName: 'Erased User',
        role: 'consumer_owner',
        status: 'deleted',
        preferredUiLanguage: 'en-IN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: new Date().toISOString(),
      });
    }
  }

  // --- Users ---
  async createUser(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const user: UserEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    const user = this.users.get(id);
    if (!user || user.status === 'deleted' || user.deletedAt) return null;
    return user;
  }

  async findUserByPhone(phone: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.phoneNumber === phone && user.status !== 'deleted' && !user.deletedAt) {
        return user;
      }
    }
    return null;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email === email && user.status !== 'deleted' && !user.deletedAt) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return updated;
  }

  // --- Organizations ---
  async createOrganization(data: Omit<OrganizationEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrganizationEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const org: OrganizationEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.organizations.set(id, org);
    return org;
  }

  async findOrganizationById(id: string): Promise<OrganizationEntity | null> {
    return this.organizations.get(id) || null;
  }

  async addOrgMember(orgId: string, userId: string, orgRole: 'org_admin' | 'org_member'): Promise<OrganizationMembershipEntity> {
    const id = uuidv4();
    const membership: OrganizationMembershipEntity = {
      id,
      organizationId: orgId,
      userId,
      orgRole,
      createdAt: new Date().toISOString(),
    };
    this.memberships.set(`${orgId}:${userId}`, membership);
    return membership;
  }

  async findOrgMembership(orgId: string, userId: string): Promise<OrganizationMembershipEntity | null> {
    return this.memberships.get(`${orgId}:${userId}`) || null;
  }

  async listOrgMembers(orgId: string): Promise<OrganizationMembershipEntity[]> {
    return Array.from(this.memberships.values()).filter((m) => m.organizationId === orgId);
  }

  // --- Patient Profiles ---
  async createPatientProfile(data: Omit<PatientProfileEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PatientProfileEntity> {
    if (!data.ownerUserId && !data.organizationId) {
      throw new Error('At least one of ownerUserId or organizationId must be provided.');
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    const profile: PatientProfileEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.patientProfiles.set(id, profile);
    return profile;
  }

  async findPatientProfileById(id: string): Promise<PatientProfileEntity | null> {
    const profile = this.patientProfiles.get(id);
    if (!profile || profile.deletedAt) return null;
    return profile;
  }

  async listPatientProfilesByOwner(userId: string): Promise<PatientProfileEntity[]> {
    return Array.from(this.patientProfiles.values()).filter(
      (p) => p.ownerUserId === userId && !p.deletedAt
    );
  }

  async listPatientProfilesByOrg(orgId: string): Promise<PatientProfileEntity[]> {
    return Array.from(this.patientProfiles.values()).filter(
      (p) => p.organizationId === orgId && !p.deletedAt
    );
  }

  async assignCaseload(patientProfileId: string, orgMemberUserId: string): Promise<CaseloadAssignmentEntity> {
    const key = `${patientProfileId}:${orgMemberUserId}`;
    if (this.caseloadAssignments.has(key)) {
      return this.caseloadAssignments.get(key)!;
    }
    const id = uuidv4();
    const assignment: CaseloadAssignmentEntity = {
      id,
      patientProfileId,
      orgMemberUserId,
      assignedAt: new Date().toISOString(),
    };
    this.caseloadAssignments.set(key, assignment);
    return assignment;
  }

  async isCaseloadAssigned(patientProfileId: string, orgMemberUserId: string): Promise<boolean> {
    return this.caseloadAssignments.has(`${patientProfileId}:${orgMemberUserId}`);
  }

  async listCaseloadForMember(orgMemberUserId: string): Promise<PatientProfileEntity[]> {
    const profileIds = new Set<string>();
    for (const a of this.caseloadAssignments.values()) {
      if (a.orgMemberUserId === orgMemberUserId) {
        profileIds.add(a.patientProfileId);
      }
    }
    return Array.from(this.patientProfiles.values()).filter(
      (p) => profileIds.has(p.id) && !p.deletedAt
    );
  }

  // --- Scans ---
  async createScan(data: Omit<ScanEntity, 'id' | 'createdAt' | 'status'>): Promise<ScanEntity> {
    const id = uuidv4();
    const scan: ScanEntity = {
      ...data,
      id,
      status: 'pending_upload',
      createdAt: new Date().toISOString(),
    };
    this.scans.set(id, scan);
    return scan;
  }

  async findScanById(id: string): Promise<ScanEntity | null> {
    return this.scans.get(id) || null;
  }

  async updateScanStatus(
    id: string,
    status: ScanStatus,
    extra?: { failureReason?: string; processingStartedAt?: string; processingCompletedAt?: string; sourceDeletedAt?: string }
  ): Promise<ScanEntity | null> {
    const scan = this.scans.get(id);
    if (!scan) return null;
    const updated: ScanEntity = {
      ...scan,
      status,
      ...extra,
    };
    this.scans.set(id, updated);
    return updated;
  }

  async listScansByProfile(patientProfileId: string): Promise<ScanEntity[]> {
    return Array.from(this.scans.values())
      .filter((s) => s.patientProfileId === patientProfileId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Scan Pages ---
  async addScanPage(scanId: string, pageNumber: number, s3ObjectKey: string, contentHash: string): Promise<ScanPageEntity> {
    // Check idempotency by content_hash & pageNumber
    for (const page of this.scanPages.values()) {
      if (page.scanId === scanId && page.pageNumber === pageNumber) {
        return page;
      }
    }
    const id = uuidv4();
    const page: ScanPageEntity = {
      id,
      scanId,
      pageNumber,
      s3ObjectKey,
      contentHash,
      createdAt: new Date().toISOString(),
    };
    this.scanPages.set(id, page);
    return page;
  }

  async getPagesForScan(scanId: string): Promise<ScanPageEntity[]> {
    return Array.from(this.scanPages.values())
      .filter((p) => p.scanId === scanId)
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }

  // --- Extraction Results ---
  async createExtractionResult(data: Omit<ExtractionResultEntity, 'id' | 'createdAt'>): Promise<ExtractionResultEntity> {
    const id = uuidv4();
    const result: ExtractionResultEntity = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.extractionResults.set(data.scanId, result);
    return result;
  }

  async findExtractionResultByScanId(scanId: string): Promise<ExtractionResultEntity | null> {
    return this.extractionResults.get(scanId) || null;
  }

  // --- Consent Records (Append-only) ---
  async addConsentRecord(data: Omit<ConsentRecordEntity, 'id' | 'recordedAt'>): Promise<ConsentRecordEntity> {
    const id = uuidv4();
    const record: ConsentRecordEntity = {
      ...data,
      id,
      recordedAt: new Date().toISOString(),
    };
    this.consentRecords.push(record);
    return record;
  }

  async getLatestConsentForUser(userId: string, consentType: ConsentRecordEntity['consentType']): Promise<ConsentRecordEntity | null> {
    const matches = this.consentRecords
      .filter((r) => r.userId === userId && r.consentType === consentType)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    return matches[0] || null;
  }

  async hasActiveThirdPartyConsent(userId: string): Promise<boolean> {
    const dataConsent = await this.getLatestConsentForUser(userId, 'data_processing');
    const aiConsent = await this.getLatestConsentForUser(userId, 'ai_processing_third_party');
    return Boolean(dataConsent?.granted && aiConsent?.granted);
  }

  // --- Share Grants ---
  async createShareGrant(data: Omit<ShareGrantEntity, 'id' | 'createdAt' | 'status'>): Promise<ShareGrantEntity> {
    const id = uuidv4();
    const grant: ShareGrantEntity = {
      ...data,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.shareGrants.set(id, grant);
    return grant;
  }

  async findShareGrantByTokenHash(tokenHash: string): Promise<ShareGrantEntity | null> {
    for (const grant of this.shareGrants.values()) {
      if (grant.inviteTokenHash === tokenHash) {
        return grant;
      }
    }
    return null;
  }

  async findShareGrantById(id: string): Promise<ShareGrantEntity | null> {
    return this.shareGrants.get(id) || null;
  }

  async updateShareGrant(id: string, updates: Partial<ShareGrantEntity>): Promise<ShareGrantEntity | null> {
    const grant = this.shareGrants.get(id);
    if (!grant) return null;
    const updated = { ...grant, ...updates };
    this.shareGrants.set(id, updated);
    return updated;
  }

  async listShareGrantsForScan(scanId: string): Promise<ShareGrantEntity[]> {
    return Array.from(this.shareGrants.values()).filter((g) => g.scanId === scanId);
  }

  // --- Quota Management (Atomic check & decrement, AC7 / Section 4.8 / Section 5.7) ---
  async getOrCreateUsageCounter(subjectType: 'user' | 'organization', subjectId: string, limit: number = 10): Promise<UsageCounterEntity> {
    const periodStart = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01
    const key = `${subjectType}:${subjectId}:${periodStart}`;
    let counter = this.usageCounters.get(key);
    if (!counter) {
      counter = {
        id: uuidv4(),
        subjectType,
        subjectId,
        periodStart,
        scansUsed: 0,
        planScanLimit: limit,
        updatedAt: new Date().toISOString(),
      };
      this.usageCounters.set(key, counter);
    }
    return counter;
  }

  // Atomically check quota and reserve 1 scan. Returns true if reserved, false if limit reached.
  async reserveScanQuota(subjectType: 'user' | 'organization', subjectId: string, limit: number = 10): Promise<boolean> {
    return new Promise((resolve) => {
      this.quotaMutex = this.quotaMutex.then(async () => {
        const counter = await this.getOrCreateUsageCounter(subjectType, subjectId, limit);
        if (counter.scansUsed >= counter.planScanLimit) {
          resolve(false);
          return;
        }
        counter.scansUsed += 1;
        counter.updatedAt = new Date().toISOString();
        this.usageCounters.set(`${subjectType}:${subjectId}:${counter.periodStart}`, counter);
        resolve(true);
      });
    });
  }

  // --- Audit Log (Section 4.3 & 8.9) ---
  async addAuditLog(entry: Omit<AuditLogEntity, 'id' | 'timestamp'>): Promise<AuditLogEntity> {
    const log: AuditLogEntity = {
      ...entry,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.push(log);
    return log;
  }

  // --- Right to Erasure Cascade (Section 4.7 / AC5) ---
  async executeUserErasure(userId: string): Promise<{ deletedProfiles: string[]; deletedScans: string[] }> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const deletedProfiles: string[] = [];
    const deletedScans: string[] = [];

    // 1. Soft-delete user immediately
    user.status = 'deleted';
    user.deletedAt = new Date().toISOString();

    // 2. Identify solely owned patient profiles (not shared with an org or other users)
    const ownedProfiles = Array.from(this.patientProfiles.values()).filter(
      (p) => p.ownerUserId === userId && !p.organizationId
    );

    for (const profile of ownedProfiles) {
      deletedProfiles.push(profile.id);
      // Hard delete scans under this profile
      const profileScans = Array.from(this.scans.values()).filter((s) => s.patientProfileId === profile.id);
      for (const scan of profileScans) {
        deletedScans.push(scan.id);
        // Cascade delete scan_pages and extraction_results
        for (const [pageId, page] of this.scanPages.entries()) {
          if (page.scanId === scan.id) {
            this.scanPages.delete(pageId);
          }
        }
        this.extractionResults.delete(scan.id);
        this.scans.delete(scan.id);
      }
      this.patientProfiles.delete(profile.id);
    }

    // 3. Revoke any share grants where user is recipient
    for (const grant of this.shareGrants.values()) {
      if (grant.grantedToUserId === userId) {
        grant.status = 'revoked';
      }
    }

    // 4. Hard delete usage counters for user
    for (const [key, counter] of this.usageCounters.entries()) {
      if (counter.subjectType === 'user' && counter.subjectId === userId) {
        this.usageCounters.delete(key);
      }
    }

    // 5. Section 4.7 Step 4d: users row deleted, except consent_records repointed to synthetic erased-user
    const erasedPlaceholderId = '00000000-0000-0000-0000-000000000000';
    for (const consent of this.consentRecords) {
      if (consent.userId === userId) {
        consent.userId = erasedPlaceholderId;
      }
    }

    this.users.delete(userId);

    return { deletedProfiles, deletedScans };
  }

  // Clear all for tests
  clearAll(): void {
    this.users.clear();
    this.organizations.clear();
    this.memberships.clear();
    this.patientProfiles.clear();
    this.caseloadAssignments.clear();
    this.scans.clear();
    this.scanPages.clear();
    this.extractionResults.clear();
    this.consentRecords = [];
    this.shareGrants.clear();
    this.usageCounters.clear();
    this.auditLogs = [];
    this.supportJustifications.clear();
    this.seedSyntheticErasedUser();
  }
}

export const db = new Database();
