import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PatientProfile, DocumentType, SupportedLanguageCode, SUPPORTED_LANGUAGES } from '../../../shared/types';
import {
  Camera,
  Upload,
  ArrowLeft,
  ArrowRight,
  FileText,
  Languages,
  RotateCcw,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface Props {
  profile: PatientProfile;
  onCancel: () => void;
  onComplete: (scanId: string) => void;
}

export const UploadWizardPage: React.FC<Props> = ({ profile, onCancel, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Doc Type & Page Count
  const [documentType, setDocumentType] = useState<DocumentType>('prescription');
  const [pageCount, setPageCount] = useState<number>(1);

  // Step 2: Captured Page Images
  const [pageFiles, setPageFiles] = useState<File[]>([]);
  const [pagePreviews, setPagePreviews] = useState<string[]>([]);

  // Step 3: Target Language
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguageCode>(
    profile.defaultTargetLanguage || 'hi-IN'
  );

  // Step 4: Submission & Processing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);

  // Step 5: Polling & Progress
  const [pollStatus, setPollStatus] = useState<'queued' | 'processing' | 'completed' | 'failed'>('queued');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rotating informative messages for Step 5 per Section 9.9
  const progressMessages = [
    'Reading doctor handwriting using Sarvam vision AI...',
    'Extracting prescribed medicine names, strengths, and timing...',
    'Analyzing dosage schedules and instructions...',
    `Translating medical explanation into ${SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.label}...`,
    'Synthesizing spoken audio with clear voice tone...',
    'Performing clinical safety rule verification...',
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  // File input handler for a specific page index
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, pageIdx: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newFiles = [...pageFiles];
      newFiles[pageIdx] = file;
      setPageFiles(newFiles);

      const previewUrl = URL.createObjectURL(file);
      const newPreviews = [...pagePreviews];
      newPreviews[pageIdx] = previewUrl;
      setPagePreviews(newPreviews);
    }
  };

  // Helper to load sample test prescription with 1 click
  const loadSamplePrescription = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FCFBF9';
      ctx.fillRect(0, 0, 600, 800);

      // Header
      ctx.fillStyle = '#2C5E43';
      ctx.fillRect(0, 0, 600, 90);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Georgia';
      ctx.fillText('APOLLO HEALTH CLINIC', 40, 45);
      ctx.font = '14px sans-serif';
      ctx.fillText('Dr. S. K. Gupta, MD (General Medicine) | Reg No: 54921', 40, 72);

      // Patient Details
      ctx.fillStyle = '#333333';
      ctx.font = '15px sans-serif';
      ctx.fillText(`Patient: ${profile.displayName} | Date: ${new Date().toLocaleDateString('en-IN')}`, 40, 130);
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 1;
      ctx.strokeRect(30, 100, 540, 50);

      // Rx Symbol
      ctx.fillStyle = '#C85A32';
      ctx.font = 'italic bold 36px Georgia';
      ctx.fillText('Rx', 40, 200);

      // Medicines
      ctx.fillStyle = '#1A1A1A';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('1. Tab. Amoxicillin 500mg', 60, 260);
      ctx.font = '14px sans-serif';
      ctx.fillText('   1 capsule 3 times daily after meals x 7 days', 60, 285);

      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('2. Tab. Paracetamol 650mg', 60, 340);
      ctx.font = '14px sans-serif';
      ctx.fillText('   1 tab twice daily SOS for fever', 60, 365);

      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('3. Cap. Pantoprazole 40mg', 60, 420);
      ctx.font = '14px sans-serif';
      ctx.fillText('   1 capsule once daily before breakfast x 7 days', 60, 445);

      // Doctor signature
      ctx.strokeStyle = '#2C5E43';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(400, 720);
      ctx.bezierCurveTo(430, 690, 480, 740, 530, 700);
      ctx.stroke();
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText("Doctor's Signature", 420, 740);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'sample_prescription.jpg', { type: 'image/jpeg' });
          setPageFiles([file]);
          setPagePreviews([URL.createObjectURL(file)]);
          setPageCount(1);
        }
      }, 'image/jpeg');
    }
  };

  // Submit scan and begin processing
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. POST /api/v1/scans
      const createRes = await api.request<{ scanId: string; status: string }>('/api/v1/scans', {
        method: 'POST',
        body: JSON.stringify({
          patientProfileId: profile.id,
          documentType,
          pageCount,
          targetLanguageCode: targetLanguage,
        }),
      });

      const newScanId = createRes.scanId;
      setScanId(newScanId);

      // 2. Upload each page
      for (let i = 0; i < pageCount; i++) {
        const file = pageFiles[i];
        if (!file) throw new Error(`Missing image for page ${i + 1}`);

        const formData = new FormData();
        formData.append('pageNumber', (i + 1).toString());
        formData.append('file', file);

        await api.request(`/api/v1/scans/${newScanId}/pages`, {
          method: 'POST',
          body: formData,
        });
      }

      // 3. Finalize scan with Idempotency-Key (Section 7.3)
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      await api.request(`/api/v1/scans/${newScanId}/finalize`, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });

      // Move to Processing step
      setCurrentStep(5);
    } catch (err: any) {
      setError(err.message || 'Failed to submit prescription for processing.');
      setIsSubmitting(false);
    }
  };

  // Processing Step Polling (every 2s per Section 9.9)
  useEffect(() => {
    if (currentStep !== 5 || !scanId) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const msgTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % progressMessages.length);
    }, 3500);

    const poller = setInterval(async () => {
      try {
        const res = await api.request<{ status: any; result: any }>(`/api/v1/scans/${scanId}`);
        setPollStatus(res.status);

        if (res.status === 'completed') {
          clearInterval(poller);
          clearInterval(timer);
          clearInterval(msgTimer);
          setTimeout(() => {
            onComplete(scanId);
          }, 800);
        } else if (res.status === 'failed') {
          clearInterval(poller);
          clearInterval(timer);
          clearInterval(msgTimer);
          setError('Reading failed. Please try a clearer photograph or retake.');
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
      clearInterval(poller);
    };
  }, [currentStep, scanId]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Wizard Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
        <button
          onClick={onCancel}
          disabled={currentStep === 5}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <div className="flex items-center gap-2 text-xs font-semibold text-moss-700">
          <span>Step {currentStep} of 4</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Action Required</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* STEP 1: Document Type & Page Count */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-stone-900">
              What kind of document are you translating?
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              Select whether this is an outpatient prescription slip or a hospital discharge summary.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div
              onClick={() => setDocumentType('prescription')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                documentType === 'prescription'
                  ? 'border-moss-600 bg-moss-50/60 shadow-xs'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div>
                <FileText
                  className={`w-7 h-7 mb-3 ${
                    documentType === 'prescription' ? 'text-moss-600' : 'text-stone-400'
                  }`}
                />
                <h3 className="font-bold text-base text-stone-900">Doctor's Prescription</h3>
                <p className="text-xs text-stone-600 mt-1">
                  Single or multi-page prescription note from a clinic or hospital consultation.
                </p>
              </div>
              <span className="mt-4 text-[11px] font-semibold text-moss-700">Typically 1–2 pages</span>
            </div>

            <div
              onClick={() => setDocumentType('discharge_summary')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                documentType === 'discharge_summary'
                  ? 'border-moss-600 bg-moss-50/60 shadow-xs'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div>
                <FileText
                  className={`w-7 h-7 mb-3 ${
                    documentType === 'discharge_summary' ? 'text-moss-600' : 'text-stone-400'
                  }`}
                />
                <h3 className="font-bold text-base text-stone-900">Discharge Summary</h3>
                <p className="text-xs text-stone-600 mt-1">
                  Hospital discharge summary listing follow-up medications and care guidelines.
                </p>
              </div>
              <span className="mt-4 text-[11px] font-semibold text-moss-700">Multi-page support (max 10)</span>
            </div>
          </div>

          {/* Page count selector */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              Number of Page Photos ({pageCount})
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="10"
                value={pageCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setPageCount(val);
                }}
                className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-moss-600"
              />
              <span className="w-10 text-center font-bold text-base text-moss-800 bg-moss-50 py-1 rounded-md border border-moss-200">
                {pageCount}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-2">
              Per PRD Section 1.6: up to 10 pages per scan for comprehensive summaries.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition"
            >
              <span>Continue to Photo Capture</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Photo Capture */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-stone-900">
                Capture Prescription Photos
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-1">
                Take a clear photograph of each page using your phone camera or upload an image file.
              </p>
            </div>
            <button
              type="button"
              onClick={loadSamplePrescription}
              className="text-xs font-semibold text-clay-700 bg-clay-50 hover:bg-clay-100 border border-clay-200 px-3 py-1.5 rounded-lg transition"
            >
              ✨ Load Sample Rx
            </button>
          </div>

          {/* Upload cards for each page */}
          <div className="space-y-4">
            {Array.from({ length: pageCount }).map((_, idx) => {
              const hasFile = Boolean(pageFiles[idx]);
              const preview = pagePreviews[idx];

              return (
                <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-moss-800">
                      Page {idx + 1} of {pageCount}
                    </span>
                    {hasFile && (
                      <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                      </span>
                    )}
                  </div>

                  {preview ? (
                    <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                      <img src={preview} alt={`Page ${idx + 1}`} className="w-full max-h-64 object-contain mx-auto" />
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <label className="cursor-pointer px-3 py-1.5 bg-stone-900/80 hover:bg-stone-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            capture="environment"
                            onChange={(e) => handleFileChange(e, idx)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-moss-500 hover:bg-moss-50/30 transition text-center group">
                      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-moss-100 group-hover:text-moss-600 transition mb-3">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-stone-800 group-hover:text-moss-700">
                        Take photo or upload page {idx + 1}
                      </span>
                      <span className="text-xs text-stone-500 mt-1">
                        PNG, JPG, or WEBP up to 15MB
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        onChange={(e) => handleFileChange(e, idx)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 border border-stone-300 rounded-xl text-stone-700 text-xs sm:text-sm font-semibold hover:bg-stone-50 transition"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={pageFiles.filter(Boolean).length < pageCount}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-40"
            >
              <span>Select Spoken Language</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Language Selection */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-stone-900">
              Select Translation & Audio Language
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              Saral supports 10 official Indic languages + English. The explanation will be translated and spoken in this tongue.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = targetLanguage === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => setTargetLanguage(lang.code)}
                  className={`p-3.5 rounded-xl border-2 transition cursor-pointer text-center select-none ${
                    isSelected
                      ? 'border-moss-600 bg-moss-50/70 shadow-xs ring-1 ring-moss-500'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="text-base font-bold text-stone-900 font-serif">
                    {lang.nativeLabel}
                  </div>
                  <div className="text-xs text-stone-500 font-medium mt-0.5">
                    {lang.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 border border-stone-300 rounded-xl text-stone-700 text-xs sm:text-sm font-semibold hover:bg-stone-50 transition"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition"
            >
              <span>Review & Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review Step */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-stone-900">
              Ready to Translate
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              Please review your document scan settings before initiating the AI reading aid.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100 text-sm">
              <span className="text-stone-500">Patient Profile:</span>
              <span className="font-bold text-stone-900">{profile.displayName}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-stone-100 text-sm">
              <span className="text-stone-500">Document Type:</span>
              <span className="font-bold text-stone-900 capitalize">{documentType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-stone-100 text-sm">
              <span className="text-stone-500">Pages:</span>
              <span className="font-bold text-stone-900">{pageCount} photo(s)</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-500">Target Language:</span>
              <span className="font-bold text-stone-900">
                {SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.label} ({SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.nativeLabel})
              </span>
            </div>
          </div>

          {/* Thumbnails preview */}
          <div className="flex gap-3 overflow-x-auto py-2">
            {pagePreviews.map((src, i) => (
              <img key={i} src={src} alt={`Page ${i + 1}`} className="w-24 h-32 object-cover rounded-xl border border-stone-300 shadow-xs" />
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(3)}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-stone-300 rounded-xl text-stone-700 text-xs sm:text-sm font-semibold hover:bg-stone-50 transition disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Translate & Generate Audio</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Processing Step (Polling every 2s, Section 9.9) */}
      {currentStep === 5 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center shadow-lg my-6">
          <div className="w-20 h-20 rounded-3xl bg-moss-100 flex items-center justify-center text-moss-700 mx-auto mb-6 shadow-inner animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin text-moss-600" />
          </div>

          <h2 className="font-editorial text-2xl font-bold text-stone-900 mb-2">
            Translating Prescription...
          </h2>

          <div className="h-10 flex items-center justify-center">
            <p className="text-sm font-medium text-stone-600 transition-all duration-300 ease-in-out">
              {progressMessages[messageIndex]}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-stone-400 font-mono">
            <Clock className="w-4 h-4" />
            <span>Elapsed: {elapsedSeconds}s</span>
          </div>

          {elapsedSeconds > 90 && (
            <div className="mt-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs max-w-md mx-auto text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Processing is taking a little longer than usual due to complex document structure. Please stay on this screen while Sarvam completes the audio synthesis.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
