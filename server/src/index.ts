import { app } from './app';
import { config } from './config';
import { db } from './db/database';
import bcrypt from 'bcryptjs';

async function bootstrap() {
  // Seed demo organization and admin for instant manual testing (Section 15.6)
  const org = await db.createOrganization({
    name: 'Apollo HomeCare Diagnostics',
    orgType: 'home_care_provider',
    sarvamKeyMode: 'platform_pooled',
    planTier: 'org_starter',
  });

  const orgAdminPassword = await bcrypt.hash('Admin@12345', 10);
  const orgAdmin = await db.createUser({
    email: 'admin@apollohomecare.com',
    displayName: 'Dr. Ramesh (Admin)',
    passwordHash: orgAdminPassword,
    preferredUiLanguage: 'en-IN',
    role: 'org_admin',
    status: 'active',
  });
  await db.addOrgMember(org.id, orgAdmin.id, 'org_admin');

  const orgStaffPassword = await bcrypt.hash('Staff@12345', 10);
  const orgStaff = await db.createUser({
    email: 'staff@apollohomecare.com',
    displayName: 'Nurse Priya',
    passwordHash: orgStaffPassword,
    preferredUiLanguage: 'en-IN',
    role: 'org_member',
    status: 'active',
  });
  await db.addOrgMember(org.id, orgStaff.id, 'org_member');

  // Seed sample patient profile assigned to Priya's caseload
  const patient = await db.createPatientProfile({
    displayName: 'Kamala Devi (Grandmother)',
    organizationId: org.id,
    ownerUserId: null,
    dateOfBirth: '1952-04-12', // 74 years old -> elderly tone trigger!
    defaultTargetLanguage: 'hi-IN',
  });
  await db.assignCaseload(patient.id, orgStaff.id);

  app.listen(config.port, () => {
    console.log(`[Saral Server] Listening on port ${config.port} (${config.nodeEnv})`);
    console.log(`[Saral Server] Storage directory: ${config.storageDir}`);
    console.log(`[Saral Server] Sarvam AI mode: ${config.useMockSarvam ? 'MOCK' : 'LIVE API'}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
