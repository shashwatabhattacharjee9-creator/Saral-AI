import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/db/database';
import { redis } from '../src/redis/redisService';
import { mockSarvam } from '../src/ai/mockSarvam';
import { authService } from '../src/modules/auth/authService';
import { classifyOcrConfidence } from '../src/algorithms/confidenceClassifier';
import { detectSafetyFlags } from '../src/algorithms/safetyFlags';
import { extractionWorker } from '../src/modules/worker/extractionWorker';
import { storage } from '../src/storage/storage';
import { sarvam } from '../src/ai/sarvamClient';
import { v4 as uuidv4 } from 'uuid';

describe('Saral Acceptance Criteria Suite (PRD Section 18: AC1 - AC9)', () => {
  beforeEach(() => {
    db.clearAll();
    redis.clearAll();
    mockSarvam.reset();
    sarvam.setApiKey(''); // Ensure isolated mock Sarvam in tests per Section 13.6
  });

  // AC1 (Upload & Extraction): Given a valid single-page prescription image and completed consent,
  // when the upload wizard finishes, then the Scan reaches status = completed within 75s p99 latency with non-empty medicines.
  it('AC1: Single-page prescription upload and extraction completes with non-empty medicines', async () => {
    // 1. Create user and grant AI consent
    const user = await db.createUser({
      phoneNumber: '+919876543210',
      displayName: 'Aarav Sharma',
      preferredUiLanguage: 'en-IN',
      role: 'consumer_owner',
      status: 'active',
    });
    const tokens = await authService.generateTokens(user.id, user.role);

    await db.addConsentRecord({
      userId: user.id,
      consentType: 'data_processing',
      granted: true,
      consentVersion: 'dpdp-v1.0',
      ipAddress: '127.0.0.1',
    });
    await db.addConsentRecord({
      userId: user.id,
      consentType: 'ai_processing_third_party',
      granted: true,
      consentVersion: 'dpdp-v1.0',
      ipAddress: '127.0.0.1',
    });

    // 2. Create patient profile
    const profile = await db.createPatientProfile({
      ownerUserId: user.id,
      organizationId: null,
      displayName: 'Mother (Devi)',
      defaultTargetLanguage: 'hi-IN',
    });

    // 3. POST /api/v1/scans
    const createScanRes = await request(app)
      .post('/api/v1/scans')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({
        patientProfileId: profile.id,
        documentType: 'prescription',
        pageCount: 1,
        targetLanguageCode: 'hi-IN',
      });
    expect(createScanRes.status).toBe(201);
    const { scanId } = createScanRes.body;
    expect(scanId).toBeDefined();

    // 4. Upload 1 page photo (fake JPEG with valid magic bytes FF D8 FF)
    const fakeJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const uploadPageRes = await request(app)
      .post(`/api/v1/scans/${scanId}/pages`)
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .field('pageNumber', '1')
      .attach('file', fakeJpgBuffer, 'rx_page_1.jpg');
    expect(uploadPageRes.status).toBe(201);

    // 5. Finalize scan
    const idempotencyKey = uuidv4();
    const finalizeRes = await request(app)
      .post(`/api/v1/scans/${scanId}/finalize`)
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send();
    expect(finalizeRes.status).toBe(202);

    // 6. Poll retrieval GET /api/v1/scans/:id until completed
    let pollRes: any;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 100));
      pollRes = await request(app)
        .get(`/api/v1/scans/${scanId}`)
        .set('Authorization', `Bearer ${tokens.accessToken}`);
      if (pollRes.body.status === 'completed') break;
    }

    expect(pollRes.status).toBe(200);
    expect(pollRes.body.status).toBe('completed');
    expect(pollRes.body.result).toBeDefined();
    expect(pollRes.body.result.medicines.length).toBeGreaterThan(0);
    expect(pollRes.body.result.audioAvailable).toBe(true);
    expect(pollRes.body.result.audioUrl).toBeDefined();
  });

  // AC2 (Confidence Scoring): Given an extraction where 2 of 5 medicines are low confidence,
  // since 2/5 = 0.40 > 0.34, ocrConfidence must evaluate to low; when 1 of 3 is low (1/3 = 0.333 <= 0.34), it must evaluate to medium.
  it('AC2: Confidence scoring satisfies boundary conditions (2/5 -> low, 1/3 -> medium)', () => {
    // Case A: 2 of 5 are low confidence -> 0.40 > 0.34 => 'low'
    const fiveMeds: any[] = [
      { name: 'Med1', schedule: '1 daily', confidence: 'high' },
      { name: 'Med2', schedule: '1 daily', confidence: 'low' },
      { name: 'Med3', schedule: '1 daily', confidence: 'high' },
      { name: 'Med4', schedule: '1 daily', confidence: 'low' },
      { name: 'Med5', schedule: '1 daily', confidence: 'high' },
    ];
    const scoreA = classifyOcrConfidence(fiveMeds, 'Standard prescription', 0.34);
    expect(scoreA).toBe('low');

    // Case B: 1 of 3 is low confidence -> 1/3 = 0.333 <= 0.34 => 'medium'
    const threeMeds: any[] = [
      { name: 'Med1', schedule: '1 daily', confidence: 'high' },
      { name: 'Med2', schedule: '1 daily', confidence: 'low' },
      { name: 'Med3', schedule: '1 daily', confidence: 'high' },
    ];
    const scoreB = classifyOcrConfidence(threeMeds, 'Standard prescription', 0.34);
    expect(scoreB).toBe('medium');

    // Case C: 0 of 3 low -> 'high'
    const allHigh: any[] = [
      { name: 'Med1', schedule: '1 daily', confidence: 'high' },
      { name: 'Med2', schedule: '1 daily', confidence: 'high' },
    ];
    expect(classifyOcrConfidence(allHigh, 'Clear', 0.34)).toBe('high');

    // Case D: 0 items extracted -> 'low'
    expect(classifyOcrConfidence([], 'Empty', 0.34)).toBe('low');
  });

  // AC3 (Degraded Translation): Given a Scan where Translate fails but extraction succeeds,
  // status becomes completed, translationAvailable = false, audioAvailable = true with English TTS audio.
  it('AC3: Degraded translation completes with fallback to English explanation and English audio', async () => {
    mockSarvam.shouldFailTranslate = true; // Inject translation failure

    const user = await db.createUser({
      phoneNumber: '+919876543211',
      displayName: 'Pooja',
      preferredUiLanguage: 'en-IN',
      role: 'consumer_owner',
      status: 'active',
    });
    const tokens = await authService.generateTokens(user.id, user.role);
    await db.addConsentRecord({
      userId: user.id,
      consentType: 'data_processing',
      granted: true,
      consentVersion: 'dpdp-v1.0',
      ipAddress: '127.0.0.1',
    });
    await db.addConsentRecord({
      userId: user.id,
      consentType: 'ai_processing_third_party',
      granted: true,
      consentVersion: 'dpdp-v1.0',
      ipAddress: '127.0.0.1',
    });

    const profile = await db.createPatientProfile({
      ownerUserId: user.id,
      organizationId: null,
      displayName: 'Father',
      defaultTargetLanguage: 'ta-IN',
    });

    const scan = await db.createScan({
      patientProfileId: profile.id,
      uploadedByUserId: user.id,
      documentType: 'prescription',
      pageCount: 1,
      targetLanguageCode: 'ta-IN',
      sarvamKeySource: 'platform_pooled',
    });

    await extractionWorker.processScan({
      scanId: scan.id,
      patientProfileId: profile.id,
      targetLanguageCode: 'ta-IN',
      requestedBy: user.id,
    });

    const pollRes = await request(app)
      .get(`/api/v1/scans/${scan.id}`)
      .set('Authorization', `Bearer ${tokens.accessToken}`);

    expect(pollRes.status).toBe(200);
    expect(pollRes.body.status).toBe('completed');
    expect(pollRes.body.result.translationAvailable).toBe(false);
    expect(pollRes.body.result.translatedExplanation).toBeNull();
    expect(pollRes.body.result.plainExplanationEn).toBeDefined();
    expect(pollRes.body.result.audioAvailable).toBe(true);
    expect(pollRes.body.result.audioUrl).toBeDefined();
  });

  // AC4 (Consent Gate): Given a user without third-party AI consent,
  // POST /scans returns 403 consent_required and prevents database insertion.
  it('AC4: User without AI consent is rejected with 403 consent_required and no scan is inserted', async () => {
    const user = await db.createUser({
      phoneNumber: '+919876543212',
      displayName: 'Sunil',
      preferredUiLanguage: 'en-IN',
      role: 'consumer_owner',
      status: 'active',
    });
    const tokens = await authService.generateTokens(user.id, user.role);

    // User only gives general data processing consent, but declines/omits third-party AI consent
    await db.addConsentRecord({
      userId: user.id,
      consentType: 'data_processing',
      granted: true,
      consentVersion: 'dpdp-v1.0',
      ipAddress: '127.0.0.1',
    });
    // ai_processing_third_party is NOT granted!

    const profile = await db.createPatientProfile({
      ownerUserId: user.id,
      organizationId: null,
      displayName: 'Self',
      defaultTargetLanguage: 'en-IN',
    });

    const initialScanCount = db.scans.size;

    const res = await request(app)
      .post('/api/v1/scans')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({
        patientProfileId: profile.id,
        documentType: 'prescription',
        pageCount: 1,
        targetLanguageCode: 'en-IN',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('consent_required');
    expect(db.scans.size).toBe(initialScanCount); // No scan inserted
  });

  // AC5 (Erasure Execution): On user deletion completion, solely-owned profiles, scans, pages,
  // and S3 objects are completely removed; consent records retain only an anonymized placeholder ID.
  it('AC5: Right-to-erasure cascade deletes solely-owned data and anonymizes consent records', async () => {
    const user = await db.createUser({
      phoneNumber: '+919876543213',
      displayName: 'Ravi',
      preferredUiLanguage: 'en-IN',
      role: 'consumer_owner',
      status: 'active',
    });
    const tokens = await authService.generateTokens(user.id, user.role);

    // Add consent record
    const consent = await db.addConsentRecord({
      userId: user.id,
      consentType: 'data_processing',
      granted: true,
      consentVersion: 'dpdp-v1.0',
      ipAddress: '127.0.0.1',
    });

    // Create solely-owned profile & scan
    const profile = await db.createPatientProfile({
      ownerUserId: user.id,
      organizationId: null,
      displayName: 'Ravi Personal',
      defaultTargetLanguage: 'hi-IN',
    });

    const scan = await db.createScan({
      patientProfileId: profile.id,
      uploadedByUserId: user.id,
      documentType: 'prescription',
      pageCount: 1,
      targetLanguageCode: 'hi-IN',
      sarvamKeySource: 'platform_pooled',
    });

    const dummyKey = await storage.savePhoto(profile.id, scan.id, 1, Buffer.from('photo'));
    await db.addScanPage(scan.id, 1, dummyKey, 'hash123');

    // Trigger DELETE /api/v1/users/me
    const delRes = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`);

    expect(delRes.status).toBe(202);
    expect(delRes.body.status).toBe('erasure_completed');

    // Verification:
    // 1. User is deleted from user table
    expect(await db.findUserById(user.id)).toBeNull();
    // 2. Profile is deleted
    expect(await db.findPatientProfileById(profile.id)).toBeNull();
    // 3. Scan is deleted
    expect(await db.findScanById(scan.id)).toBeNull();
    // 4. Consent records retained but repointed to anonymized placeholder ID (00000000-0000-0000-0000-000000000000)
    expect(consent.userId).toBe('00000000-0000-0000-0000-000000000000');
  });

  // AC6 (Authorization Leak Prevention): An org member requesting a scan outside their caseload receives 404 not_found.
  it('AC6: Org member requesting a scan outside their assigned caseload receives 404 not_found', async () => {
    // Create org
    const org = await db.createOrganization({
      name: 'Care Clinic',
      orgType: 'hospital',
      sarvamKeyMode: 'platform_pooled',
    });

    // Create org member Nurse A
    const nurseA = await db.createUser({
      email: 'nurseA@clinic.com',
      displayName: 'Nurse A',
      role: 'org_member',
      status: 'active',
    });
    await db.addOrgMember(org.id, nurseA.id, 'org_member');
    const nurseATokens = await authService.generateTokens(nurseA.id, nurseA.role);

    // Create org member Nurse B
    const nurseB = await db.createUser({
      email: 'nurseB@clinic.com',
      displayName: 'Nurse B',
      role: 'org_member',
      status: 'active',
    });
    await db.addOrgMember(org.id, nurseB.id, 'org_member');

    // Create patient profile assigned only to Nurse B
    const patientB = await db.createPatientProfile({
      organizationId: org.id,
      ownerUserId: null,
      displayName: 'Patient of Nurse B',
      defaultTargetLanguage: 'hi-IN',
    });
    await db.assignCaseload(patientB.id, nurseB.id);

    const scanB = await db.createScan({
      patientProfileId: patientB.id,
      uploadedByUserId: nurseB.id,
      documentType: 'prescription',
      pageCount: 1,
      targetLanguageCode: 'hi-IN',
      sarvamKeySource: 'platform_pooled',
    });

    // Nurse A tries to access scanB (outside Nurse A's caseload)
    const leakAttempt = await request(app)
      .get(`/api/v1/scans/${scanB.id}`)
      .set('Authorization', `Bearer ${nurseATokens.accessToken}`);

    expect(leakAttempt.status).toBe(404);
    expect(leakAttempt.body.error.code).toBe('not_found');
  });

  // AC7 (Quota Race Condition): When two concurrent scan creations are attempted with 1 quota left,
  // exactly one succeeds and one receives 422 quota_exceeded.
  it('AC7: Two concurrent scan creations with 1 quota left serialize: exactly 1 succeeds, 1 gets 422 quota_exceeded', async () => {
    const user = await db.createUser({
      phoneNumber: '+919876543214',
      displayName: 'Concurrent Tester',
      preferredUiLanguage: 'en-IN',
      role: 'consumer_owner',
      status: 'active',
    });
    const tokens = await authService.generateTokens(user.id, user.role);

    await db.addConsentRecord({
      userId: user.id,
      consentType: 'data_processing',
      granted: true,
      consentVersion: 'dpdp-v1.0',
      ipAddress: '127.0.0.1',
    });
    await db.addConsentRecord({
      userId: user.id,
      consentType: 'ai_processing_third_party',
      granted: true,
      consentVersion: 'dpdp-v1.0',
      ipAddress: '127.0.0.1',
    });

    const profile = await db.createPatientProfile({
      ownerUserId: user.id,
      organizationId: null,
      displayName: 'Test Profile',
      defaultTargetLanguage: 'hi-IN',
    });

    // Set usage counter so exactly 1 scan remains (e.g. limit 10, used 9)
    const counter = await db.getOrCreateUsageCounter('user', user.id, 10);
    counter.scansUsed = 9;

    // Fire 2 simultaneous scan creation requests
    const p1 = request(app)
      .post('/api/v1/scans')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({
        patientProfileId: profile.id,
        documentType: 'prescription',
        pageCount: 1,
        targetLanguageCode: 'hi-IN',
      });

    const p2 = request(app)
      .post('/api/v1/scans')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({
        patientProfileId: profile.id,
        documentType: 'prescription',
        pageCount: 1,
        targetLanguageCode: 'hi-IN',
      });

    const [res1, res2] = await Promise.all([p1, p2]);
    const statuses = [res1.status, res2.status];

    expect(statuses).toContain(201);
    expect(statuses).toContain(422);

    const rejectedRes = res1.status === 422 ? res1 : res2;
    expect(rejectedRes.body.error.code).toBe('quota_exceeded');
  });

  // AC8 (Safety Flagging): When two medicines match the interaction list,
  // KNOWN_INTERACTION_PAIR with high severity is emitted and requires frontend acknowledgment.
  it('AC8: Two medicines matching the interaction pair list trigger KNOWN_INTERACTION_PAIR with high severity', () => {
    // Curated pair: Aspirin and Ibuprofen
    const medicines: any[] = [
      { name: 'Aspirin 75mg', schedule: '1 tablet daily after food for 30 days', confidence: 'high' },
      { name: 'Ibuprofen 400mg', schedule: '1 tablet twice daily as needed for 3 days', confidence: 'high' },
    ];

    const flags = detectSafetyFlags(medicines, 'Take medications with food.');
    const interactionFlag = flags.find((f) => f.code === 'KNOWN_INTERACTION_PAIR');

    expect(interactionFlag).toBeDefined();
    expect(interactionFlag?.severity).toBe('high');
    expect(interactionFlag?.message).toContain('Aspirin 75mg and Ibuprofen 400mg are sometimes flagged for interaction');
  });

  // AC9 (Share Expiration): An accept request on an expired share grant returns 410 and updates status to expired.
  it('AC9: An accept request on an expired share grant returns 410 and updates status to expired', async () => {
    const owner = await db.createUser({
      phoneNumber: '+919876543215',
      displayName: 'Owner User',
      preferredUiLanguage: 'en-IN',
      role: 'consumer_owner',
      status: 'active',
    });

    const recipient = await db.createUser({
      phoneNumber: '+919876543216',
      displayName: 'Sibling User',
      preferredUiLanguage: 'en-IN',
      role: 'consumer_viewer',
      status: 'active',
    });
    const recipientTokens = await authService.generateTokens(recipient.id, recipient.role);

    const profile = await db.createPatientProfile({
      ownerUserId: owner.id,
      organizationId: null,
      displayName: 'Parent',
      defaultTargetLanguage: 'hi-IN',
    });

    const scan = await db.createScan({
      patientProfileId: profile.id,
      uploadedByUserId: owner.id,
      documentType: 'prescription',
      pageCount: 1,
      targetLanguageCode: 'hi-IN',
      sarvamKeySource: 'platform_pooled',
    });

    // Create an already-expired grant (expired 1 day ago)
    const rawToken = 'expired-token-xyz-123';
    const tokenHash = require('crypto').createHash('sha256').update(rawToken).digest('hex');
    const pastDate = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const grant = await db.createShareGrant({
      scanId: scan.id,
      grantedByUserId: owner.id,
      inviteTokenHash: tokenHash,
      expiresAt: pastDate,
    });

    // Recipient attempts to accept the expired share token
    const acceptRes = await request(app)
      .post(`/api/v1/share-grants/${rawToken}/accept`)
      .set('Authorization', `Bearer ${recipientTokens.accessToken}`);

    expect(acceptRes.status).toBe(410);
    expect(acceptRes.body.error.code).toBe('expired');

    // Verify grant status was updated to expired
    const updatedGrant = await db.findShareGrantById(grant.id);
    expect(updatedGrant?.status).toBe('expired');
  });
});
