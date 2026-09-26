# Saral (सरल) — Prescription & Discharge-Summary Translator for Indian Families

[![Tests: Passing](https://img.shields.io/badge/Tests-9%2F9%20AC%20Passing-emerald)](./server/test/acceptance_criteria.test.ts)
[![Compliance: DPDP Act 2023](https://img.shields.io/badge/DPDP%20Act%202023-Compliant-blue)](#data-protection--privacy-dpdp-act)
[![AI Engine: Sarvam AI](https://img.shields.io/badge/AI%20Provider-Sarvam%20AI-orange)](#sarvam-ai-pipeline)

> **Core Value Proposition:** One photo in; a medicine list, a plain-language explanation, a translation into 10 Indic languages + English, and spoken audio out — in under 90 seconds, in the language the family actually speaks.

---

## 1. System Architecture

Saral is designed as a production-grade **modular monolith** with clean service boundaries, relational data integrity, and asynchronous extraction job queues:

```
+---------------------------------------------------------------------------------+
|                               API Server (Node.js/Express/TS)                  |
|                                                                                 |
|  [Auth Module]     [Profile Module]     [Scan Module]      [Organization Mod]   |
|   (Phone OTP/JWT)   (Family Profiles)    (Upload & Polling) (Caseload B2B2C)   |
|                                                                                 |
|  [Consent/DPDP]    [Sharing Module]     [Rate Limiter]     [Storage Service]    |
|   (Right-to-Erase)  (7-day Token Grant)  (Token-Bucket)     (Pre-signed S3 URLs)|
+---------------------------------------------------------------------------------+
          |                                               |
     enqueue job                                    atomic query
          v                                               v
+-----------------------+                       +-------------------+
|   Extraction Worker   |<--------------------->|    PostgreSQL     |
| - Sarvam Gemma4 Vision|                       +-------------------+
| - Mayura Translation  |                       +-------------------+
| - Bulbul v2 TTS Audio |<--------------------->| Redis Cache/Locks |
| - Confidence & Flags  |                       +-------------------+
+-----------------------+
```

### Key Technology Choices
- **Backend**: Node.js 20+ LTS + TypeScript, Express, Helmet, CORS, Multer.
- **Database**: PostgreSQL 15 relational schema (`server/src/db/schema.sql`) with transactional guarantees (`SELECT ... FOR UPDATE` quota locking), JSONB extraction payload, and soft/hard deletion lifecycle.
- **Cache & Concurrency**: Redis key namespaces (`session:{token}`, `ratelimit:{userId|ip}:{route}`, `profile:{profileId}`, `idempotency:{key}`, `lock:scan-processing:{scanId}`).
- **Object Storage**: S3-compatible file layout with 15-minute time-limited HMAC pre-signed URLs.
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS with the PRD-mandated warm editorial palette (moss-green `#2C5E43`, clay `#C85A32`, parchment `#FBF9F5`). Mobile-first responsive layout (down to 360px) and bottom tab navigation.
- **AI Engine**: Sarvam AI API client (`gemma4` vision chat completions, `sarvam-translate:v1`, `bulbul:v2` text-to-speech) + configurable **Mock Sarvam Server** (Section 13.6) for offline testing and dev.

---

## 2. Acceptance Criteria Verification (AC1 – AC9)

All 9 acceptance criteria specified in Section 18 of the PRD are covered by automated integration tests in [`server/test/acceptance_criteria.test.ts`](file:///server/test/acceptance_criteria.test.ts):

| Criteria | Description | Verification Method | Status |
| :--- | :--- | :--- | :---: |
| **AC1** | **Upload & Extraction**: Valid single-page prescription + consent completes within 75s with non-empty medicines. | Supertest API test + worker extraction | **PASSED** |
| **AC2** | **Confidence Scoring**: Boundary test: 2 of 5 low confidence (40% > 34%) = `low`; 1 of 3 low (33.3% ≤ 34%) = `medium`. | Unit boundary test (`confidenceClassifier.test.ts`) | **PASSED** |
| **AC3** | **Degraded Translation**: When Translate fails, scan completes with English fallback & English TTS audio (`translationAvailable = false`). | Fault-injected mock Translate test | **PASSED** |
| **AC4** | **Consent Gate**: Without third-party AI consent, `POST /scans` returns `403 consent_required` and prevents DB insertion. | HTTP auth gate test | **PASSED** |
| **AC5** | **Erasure Execution**: `DELETE /users/me` permanently purges solely-owned profiles, scans, pages, and S3 objects; consent records repointed to anonymized ID. | DPDP Act cascade test | **PASSED** |
| **AC6** | **Authorization Leak Prevention**: Org member requesting scan outside their assigned caseload receives `404 not_found`. | ABAC caseload boundary test | **PASSED** |
| **AC7** | **Quota Race Condition**: Two concurrent scan creation requests with 1 quota left serialize: exactly 1 succeeds, 1 receives `422 quota_exceeded`. | Atomic mutex & counter test | **PASSED** |
| **AC8** | **Safety Flagging**: Two medicines matching static interaction list emit `KNOWN_INTERACTION_PAIR` with high severity. | Rule engine test (Aspirin + Ibuprofen) | **PASSED** |
| **AC9** | **Share Expiration**: An accept request on an expired share grant returns `410` and updates status to `expired`. | 7-day token expiration lifecycle test | **PASSED** |

---

## 3. Sarvam AI Pipeline

The pipeline follows the 5-step workflow defined in PRD Section 6.2:

1. **Step 1 — Extract & Simplify**: Fetches scan pages, base64 encodes, and calls Sarvam Chat Completions (`gemma4` vision). System prompt adapts for elderly patients (65+ years) by favoring short sentences for audio listening comprehension (Section 5.3). Saves `sarvam_request_ids.chatRequestId` for crash-recovery idempotency (Section 5.6).
2. **Step 2 — OCR Confidence Classification**: Mechanical formula (`OCR_LOW_CONFIDENCE_RATIO_THRESHOLD = 0.34`). Outputs `high`, `medium`, or `low`. Triggers retake banner if low.
3. **Step 3 — Safety-Flag Detection**: Deterministic rule engine for:
   - `ILLEGIBLE_DOSE` (medium)
   - `MISSING_DURATION` (low)
   - `KNOWN_INTERACTION_PAIR` (high, e.g., Aspirin + Ibuprofen)
   - `HIGH_RISK_KEYWORD` (high, e.g., emergency, anaphylaxis)
   High severity flags require explicit checkbox acknowledgment on the frontend before proceeding.
4. **Step 4 — Translate**: Translates canonical English explanation into the reader's choice of 10 Indic languages (`hi-IN`, `ta-IN`, `te-IN`, `kn-IN`, `ml-IN`, `mr-IN`, `bn-IN`, `gu-IN`, `pa-IN`, `od-IN`). Gracefully degrades to English if upstream translation fails.
5. **Step 5 — Text-to-Speech**: Synthesizes spoken audio using Sarvam `bulbul:v2` (`anushka` voice), truncated to 1500 chars. Saves PCM WAV audio to storage. Dedicated retry audio endpoint available (`POST /scans/:id/audio/retry`).

---

## 4. Quick Start & Running Locally

### Prerequisites
- Node.js 20+ LTS
- npm 10+

### Setup & Running

```bash
# 1. Install dependencies in both backend and frontend
npm --prefix server install
npm --prefix client install

# 2. Run automated test suite (AC1 - AC9)
npm --prefix server test

# 3. Start Backend Server (port 4000)
npm --prefix server run dev

# 4. In a second terminal, start Frontend Dev Server (port 3000)
npm --prefix client run dev
```

Open your browser at **`http://localhost:3000`**.

### Demo Credentials
- **Consumer User**: Enter any valid phone number (e.g. `+919876543210`). In development mode, the OTP code is displayed directly in the UI.
- **Healthcare Org Staff (B2B2C)**:
  - Nurse Priya: `staff@apollohomecare.com` / `Staff@12345`
  - Dr. Ramesh (Admin): `admin@apollohomecare.com` / `Admin@12345`

### Sample Prescription Generator
In the upload wizard (Step 2), click **"✨ Load Sample Rx"** to generate an authentic clinic prescription image with one click, or upload your own prescription photograph.

---

## 5. API Reference Summary

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/otp/request` | Request 6-digit OTP | 202 Accepted |
| `POST` | `/api/v1/auth/otp/verify` | Verify OTP & receive JWT token pair | 200 OK |
| `POST` | `/api/v1/auth/refresh` | Rotate 30-day refresh token | 200 OK |
| `GET` | `/api/v1/patient-profiles` | List family profiles / caseload | 200 OK |
| `POST` | `/api/v1/patient-profiles` | Create family member profile | 201 Created |
| `POST` | `/api/v1/scans` | Create scan shell (checks quota & AI consent) | 201 Created |
| `POST` | `/api/v1/scans/:id/pages` | Upload page photo (SHA-256 dedup) | 201 Created |
| `POST` | `/api/v1/scans/:id/finalize` | Finalize & enqueue job (`Idempotency-Key`) | 202 Accepted |
| `GET` | `/api/v1/scans/:id` | Poll scan status & fetch result | 200 OK |
| `POST` | `/api/v1/scans/:id/audio/retry` | Retry TTS audio generation | 202 Accepted |
| `POST` | `/api/v1/scans/:id/share` | Generate 7-day share link | 201 Created |
| `POST` | `/api/v1/share-grants/:token/accept` | Accept share invitation | 200 OK |
| `GET` | `/api/v1/users/me/consent-status` | Inspect DPDP consent status | 200 OK |
| `POST` | `/api/v1/users/me/consent` | Record consent choice | 201 Created |
| `GET` | `/api/v1/users/me/data-export` | Download full health data export (JSON) | 202 Accepted |
| `DELETE` | `/api/v1/users/me` | Trigger DPDP right-to-erasure cascade | 202 Accepted |
| `GET` | `/health/live` & `/health/ready` | Container liveness & readiness probes | 200 OK |

---

## 6. Data Protection & Privacy (DPDP Act)

1. **Purpose Limitation**: Sarvam AI models receive only document images and language codes; never personal identifiers or patient names.
2. **30-Day Photo Purge**: Raw prescription photos and audio files are retained for only 30 days, then permanently deleted to protect accidental background sensitive data.
3. **Right to Erasure**: `DELETE /api/v1/users/me` removes all user data, solely-owned profiles, scans, and files. Compliance consent proof is retained for 7 years repointed to an anonymized placeholder ID (`00000000-0000-0000-0000-000000000000`).
4. **Persistent Medical Disclaimer**: Displayed non-dismissably across all medical result screens:
   > *"Saral helps you understand medical documents but is not a substitute for professional medical advice. Always confirm with your doctor or pharmacist before making any decisions."*
