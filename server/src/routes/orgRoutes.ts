import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { requireAuth } from '../middleware/authGuard';
import bcrypt from 'bcryptjs';

export const orgRouter = Router();

// POST /api/v1/organizations (back-office creation per Section 6.3)
orgRouter.post('/', async (req: Request, res: Response) => {
  const { name, orgType, sarvamKeyMode, sarvamEncryptedKey } = req.body || {};
  if (!name || !orgType) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'name and orgType are required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // Section 4.2 CHECK constraint: if byok, sarvamEncryptedKey is NOT NULL
  if (sarvamKeyMode === 'byok' && !sarvamEncryptedKey) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'sarvamEncryptedKey is required when sarvamKeyMode is byok.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const org = await db.createOrganization({
    name,
    orgType,
    sarvamKeyMode: sarvamKeyMode || 'platform_pooled',
    sarvamEncryptedKey: sarvamEncryptedKey || null,
    planTier: 'org_starter',
  });

  res.status(201).json(org);
});

// POST /api/v1/organizations/:orgId/members/invite
orgRouter.post('/:orgId/members/invite', requireAuth, async (req: Request, res: Response) => {
  const orgId = String(req.params.orgId);
  const { email, displayName, orgRole, initialPassword } = req.body || {};

  if (!email || !displayName) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'email and displayName are required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const roleToAssign = orgRole === 'org_admin' ? 'org_admin' : 'org_member';

  // Find or create member user
  let memberUser = await db.findUserByEmail(email);
  if (!memberUser) {
    const passwordHash = await bcrypt.hash(initialPassword || 'TemporaryPass123!', 10);
    memberUser = await db.createUser({
      email,
      displayName,
      passwordHash,
      preferredUiLanguage: 'en-IN',
      role: roleToAssign,
      status: 'active',
    });
  }

  const membership = await db.addOrgMember(orgId, memberUser.id, roleToAssign);
  res.status(201).json({
    membershipId: membership.id,
    user: memberUser,
    orgRole: membership.orgRole,
  });
});

// GET /api/v1/organizations/:orgId/members
orgRouter.get('/:orgId/members', requireAuth, async (req: Request, res: Response) => {
  const orgId = String(req.params.orgId);
  const memberships = await db.listOrgMembers(orgId);
  const members = [];
  for (const m of memberships) {
    const user = await db.findUserById(m.userId);
    if (user) {
      members.push({
        id: m.id,
        user,
        orgRole: m.orgRole,
        joinedAt: m.createdAt,
      });
    }
  }

  res.status(200).json({ data: members });
});

// POST /api/v1/organizations/:orgId/caseload (Assign patient profile to org member)
orgRouter.post('/:orgId/caseload', requireAuth, async (req: Request, res: Response) => {
  const { patientProfileId, orgMemberUserId } = req.body || {};
  if (!patientProfileId || !orgMemberUserId) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'patientProfileId and orgMemberUserId are required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const assignment = await db.assignCaseload(patientProfileId, orgMemberUserId);
  res.status(201).json(assignment);
});

// GET /api/v1/organizations/:orgId/usage (Admin usage stats per Section 7.6)
orgRouter.get('/:orgId/usage', requireAuth, async (req: Request, res: Response) => {
  const orgId = String(req.params.orgId);
  const counter = await db.getOrCreateUsageCounter('organization', orgId, 500);

  res.status(200).json({
    organizationId: orgId,
    periodStart: counter.periodStart,
    scansUsed: counter.scansUsed,
    planScanLimit: counter.planScanLimit,
    remainingScans: Math.max(0, counter.planScanLimit - counter.scansUsed),
  });
});
