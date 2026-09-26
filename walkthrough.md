# Saral (सरल) — Implementation & Verification Walkthrough

**Saral** is a prescription and hospital discharge-summary translator engineered for Indian families. It converts photographs of handwritten or printed medical documents into structured medicine schedules, plain-language explanations in 10 Indic languages + English, and synthesized spoken audio in under 90 seconds.

---

## 1. What Was Built

Following the 38-page authoritative Product Requirements Document (PRD v1.0), the product was built end-to-end as a modular monolith:

### A. Core Architecture & Backend (`server/`)
1. **Database Schema & DDL (`server/src/db/schema.sql` & `database.ts`)**:
   - Implemented all 12 tables and enums per PRD Section 4.2:
     - `users` (phone E.164, role, soft-deletion)
     - `organizations` & `organization_memberships` (B2B2C caseload support)
     - `patient_profiles` & `patient_profile_caseload_assignments` (multi-profile family management)
     - `scans` & `scan_pages` (multi-page prescription & discharge support up to 10 pages)
     - `extraction_results` (medicines JSONB, canonical English text, Indic translation, safety flags, confidence)
     - `consent_records` (DPDP Act append-only audit trail)
     - `share_grants` (7-day time-limited token links)
     - `usage_counters` (atomic quota reservation)
     - `audit_log` & `support_access_justifications`
2. **Algorithms & Business Logic (`server/src/algorithms/`)**:
   - `confidenceClassifier.ts`: OCR confidence classification (`OCR_LOW_CONFIDENCE_RATIO_THRESHOLD = 0.34`), satisfying AC2 boundary conditions.
   - `safetyFlags.ts`: Rule engine for `ILLEGIBLE_DOSE` (medium), `MISSING_DURATION` (low), `KNOWN_INTERACTION_PAIR` (high), and `HIGH_RISK_KEYWORD` (high).
   - `toneAdapter.ts`: Age detection (65+) adapting system prompt instructions for elderly audio listening comprehension.
3. **Sarvam AI Engine (`server/src/ai/`)**:
   - `sarvamClient.ts`: Vision OCR completions with `gemma4`, translation with `sarvam-translate:v1`, and TTS with `bulbul:v2` (`anushka` voice).
   - `mockSarvam.ts`: Section 13.6 configurable mock Sarvam service generating realistic Indic translations, PCM WAV audio buffers, and error injection modes.
4. **Extraction Worker & Queue (`server/src/modules/worker/`)**:
   - Executes Steps 1 to 5 of the extraction pipeline.
   - Idempotency with Redis distributed locks (`lock:scan-processing:{scanId}`) and pre-commit request ID persistence.
   - Graceful translation fallback to English and manual audio retry endpoint (`POST /scans/:id/audio/retry`).
5. **Security & DPDP Act Compliance**:
   - Token-bucket rate limiting (`auth`: 3/10min per phone, `upload`: 5/min, `general`: 60/min).
   - Magic-byte image validation (JPEG, PNG, WebP) and SHA-256 deduplication.
   - Consent gating: `403 consent_required` if AI processing consent is missing.
   - Right-to-Erasure cascade (`DELETE /api/v1/users/me`) purging solely-owned data and anonymizing consent records to placeholder ID `00000000-0000-0000-0000-000000000000` (retained 7 years).

---

### B. Responsive Frontend (`client/`)
1. **Design System & Palette (Section 9.11)**:
   - Warm, cross-generational editorial palette (moss green `#2C5E43`, clay `#C85A32`, warm parchment `#FBF9F5`).
   - Large accessible typography (`Lora` serif and `Plus Jakarta Sans`).
2. **User Journeys & Pages**:
   - **Login / Signup (`LoginPage.tsx`)**: Phone number OTP with country code `+91` + Healthcare org staff email login toggle.
   - **DPDP Consent Gate (`ConsentModal.tsx`)**: Clear purpose limitation disclosure, 30-day photo retention explanation, and right-to-erasure notice.
   - **Family Profiles (`ProfilesPage.tsx` & `ProfileDetailPage.tsx`)**: Add family members with nicknames ("Amma", "Dad"), age calculation, and scan history.
   - **Multi-Step Upload Wizard (`UploadWizardPage.tsx`)**:
     - *Step 1*: Document type (Prescription vs. Discharge summary) and page count (1 to 10).
     - *Step 2*: Native camera/gallery picker (`capture="environment"`) with client-side retake and **"✨ Load Sample Rx"** one-click tester.
     - *Step 3*: Target language chip selector across 10 Indic languages + English.
     - *Step 4*: Review & submit.
     - *Step 5*: Real-time 2-second polling with friendly rotating messages and 90s soft timeout warning.
   - **Scan Detail View (`ScanDetailPage.tsx`)**:
     - Persistent Non-Dismissable Medical Disclaimer Banner.
     - Prominent OCR Confidence Badge (High / Medium / Low with "Retake photo" action).
     - Safety Flags (High severity flags requiring explicit user acknowledgment checkbox).
     - High-Contrast Spoken Audio Player with play/pause, scrub bar, speed multiplier (0.75x, 1x, 1.25x), and retry audio button.
     - Bilingual tabs: Translated Indic explanation vs Canonical English original.
     - Structured Medicines table (medication name, instructions/schedule, confidence pill).
   - **Sharing (`ShareModal.tsx` & `ShareAcceptPage.tsx`)**: Generates 7-day read-only share link with copy-to-clipboard; handles expired links with 410 notice.
   - **Privacy & Data Center (`DataSettingsPage.tsx`)**: View active consent records, download full health data JSON export, and trigger irreversible account erasure.
   - **Healthcare Org Dashboard (`OrgDashboardPage.tsx`)**: Caseload management, scan upload on behalf of assigned patients, and org-wide monthly usage meter.

---

## 2. Automated Test Suite Results

All 9 Acceptance Criteria from Section 18 were executed via Vitest and passed:

```
 RUN  v3.2.7 server/

 ✓ test/acceptance_criteria.test.ts (9 tests)
   ✓ AC1: Single-page prescription upload and extraction completes with non-empty medicines
   ✓ AC2: Confidence scoring satisfies boundary conditions (2/5 -> low, 1/3 -> medium, 0/3 -> high, empty -> low)
   ✓ AC3: Degraded translation completes with fallback to English explanation and English audio
   ✓ AC4: User without AI consent is rejected with 403 consent_required and no scan is inserted
   ✓ AC5: Right-to-erasure cascade deletes solely-owned data and anonymizes consent records
   ✓ AC6: Org member requesting a scan outside their assigned caseload receives 404 not_found
   ✓ AC7: Two concurrent scan creations with 1 quota left serialize: exactly 1 succeeds, 1 gets 422 quota_exceeded
   ✓ AC8: Two medicines matching the interaction pair list trigger KNOWN_INTERACTION_PAIR with high severity
   ✓ AC9: An accept request on an expired share grant returns 410 and updates status to expired

 Test Files  1 passed (1)
      Tests  9 passed (9)
```

---

## 3. How to Run Locally

### Terminal 1: Backend Server (Port 4000)
```powershell
npm --prefix server run dev
```

### Terminal 2: Frontend Client (Port 3000)
```powershell
npm --prefix client run dev
```

Open `http://localhost:3000` in any web browser.

### Instant Testing Guide
1. Enter your phone number (e.g. `+919876543210`) -> verify with the Dev OTP shown on screen.
2. Accept the DPDP Privacy & Consent prompt.
3. Select or add a family member (e.g. "Amma").
4. Click **"Scan a Prescription"** -> click **"✨ Load Sample Rx"** in Step 2 to generate a sample prescription -> select your preferred language (e.g. Hindi, Tamil, Telugu) -> click **"Translate & Generate Audio"**.
5. The 2-second poller completes and opens the prescription results with spoken audio, safety flags, and medicine breakdown!
