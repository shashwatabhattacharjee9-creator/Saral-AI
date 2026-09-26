export type SupportedLanguageCode =
  | 'en-IN'
  | 'hi-IN'
  | 'bn-IN'
  | 'ta-IN'
  | 'te-IN'
  | 'kn-IN'
  | 'ml-IN'
  | 'mr-IN'
  | 'gu-IN'
  | 'pa-IN'
  | 'od-IN';

export interface LanguageOption {
  code: SupportedLanguageCode;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'en-IN', label: 'English', nativeLabel: 'English' },
  { code: 'ta-IN', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'kn-IN', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'mr-IN', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'bn-IN', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'gu-IN', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'pa-IN', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'od-IN', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
];

export type UserRole =
  | 'consumer_owner'
  | 'consumer_viewer'
  | 'org_admin'
  | 'org_member'
  | 'platform_admin';

export type UserStatus = 'active' | 'suspended' | 'pending_deletion' | 'deleted';

export type DocumentType = 'prescription' | 'discharge_summary';

export type ScanStatus =
  | 'pending_upload'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export type OcrConfidenceLevel = 'high' | 'medium' | 'low';

export type SafetyFlagSeverity = 'high' | 'medium' | 'low';

export type SafetyFlagCode =
  | 'ILLEGIBLE_DOSE'
  | 'MISSING_DURATION'
  | 'KNOWN_INTERACTION_PAIR'
  | 'HIGH_RISK_KEYWORD';

export interface SafetyFlag {
  code: SafetyFlagCode;
  message: string;
  severity: SafetyFlagSeverity;
}

export interface MedicineItem {
  name: string;
  schedule: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface ExtractionResultPayload {
  medicines: MedicineItem[];
  plainExplanationEn: string;
  translatedExplanation: string | null;
  translationAvailable: boolean;
  audioUrl: string | null;
  audioAvailable: boolean;
  ocrConfidence: OcrConfidenceLevel;
  safetyFlags: SafetyFlag[];
}

export interface ScanResponse {
  scanId: string;
  status: ScanStatus;
  documentType: DocumentType;
  targetLanguageCode: SupportedLanguageCode;
  pageCount: number;
  failureReason?: string | null;
  createdAt: string;
  processingStartedAt?: string | null;
  processingCompletedAt?: string | null;
  result: ExtractionResultPayload | null;
}

export interface PatientProfile {
  id: string;
  ownerUserId: string | null;
  organizationId: string | null;
  displayName: string;
  dateOfBirth?: string | null;
  defaultTargetLanguage: SupportedLanguageCode;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  phoneNumber?: string | null;
  email?: string | null;
  displayName: string;
  preferredUiLanguage: 'en-IN' | 'hi-IN';
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'data_processing' | 'ai_processing_third_party' | 'marketing_communication';
  granted: boolean;
  consentVersion: string;
  recordedAt: string;
}

export interface ShareGrant {
  id: string;
  scanId: string;
  grantedByUserId: string;
  grantedToUserId?: string | null;
  inviteToken?: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  orgType: 'diagnostic_chain' | 'home_care_provider' | 'hospital' | 'other';
  sarvamKeyMode: 'platform_pooled' | 'byok';
  planTier: string;
  createdAt: string;
}

export interface StandardErrorEnvelope {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}
