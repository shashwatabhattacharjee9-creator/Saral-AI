import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Trash2, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsentModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { grantConsent } = useAuth();

  const [dataProcessing, setDataProcessing] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataProcessing || !aiProcessing) {
      setError('Both core medical data processing and third-party AI processing consents are required to read prescriptions.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await grantConsent('data_processing', dataProcessing);
      await grantConsent('ai_processing_third_party', aiProcessing);
      if (marketing) {
        await grantConsent('marketing_communication', marketing);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record consent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200">
        <div className="flex items-center gap-3 text-moss-700 mb-4">
          <div className="p-2.5 bg-moss-100 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-moss-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-editorial text-stone-900">Your Privacy & Consent</h2>
            <span className="text-xs text-stone-500 font-medium">Digital Personal Data Protection (DPDP) Act, 2023</span>
          </div>
        </div>

        <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-5">
          Before analyzing medical documents, Saral requires your explicit consent. Your health data is safeguarded with strict DPDP compliance:
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item 1: Core Data Processing */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dataProcessing}
              onChange={(e) => setDataProcessing(e.target.checked)}
              className="w-5 h-5 rounded text-moss-600 border-stone-300 focus:ring-moss-500 mt-0.5"
            />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-stone-900 block">Core Health Data Processing (Mandatory)</span>
              <span className="text-stone-600 text-xs mt-0.5 block">
                Allow Saral to securely process your prescription photographs solely to generate medication schedules and plain-language summaries.
              </span>
            </div>
          </label>

          {/* Item 2: AI Processing (Sarvam AI) */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition cursor-pointer select-none">
            <input
              type="checkbox"
              checked={aiProcessing}
              onChange={(e) => setAiProcessing(e.target.checked)}
              className="w-5 h-5 rounded text-moss-600 border-stone-300 focus:ring-moss-500 mt-0.5"
            />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-stone-900 block">Third-Party AI Translation & Audio (Mandatory)</span>
              <span className="text-stone-600 text-xs mt-0.5 block">
                Enable Sarvam AI’s Indic language models (vision OCR, Mayura translation, Bulbul audio synthesis) to transcribe and speak instructions in your preferred language. No personal identifiers are shared with AI models.
              </span>
            </div>
          </label>

          {/* Informational safeguards badge */}
          <div className="bg-parchment-200/60 p-3.5 rounded-xl text-[12px] text-stone-700 space-y-2 border border-parchment-300">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Lock className="w-4 h-4 text-moss-700" />
              <span>Built-in Privacy Safeguards</span>
            </div>
            <div className="flex items-start gap-2">
              <Trash2 className="w-3.5 h-3.5 text-clay-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>30-Day Auto-Purge:</strong> Original prescription photos are automatically hard-deleted after 30 days. Only the structured results remain.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-moss-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Right to Erasure:</strong> You can export or permanently delete your entire medical history at any time from your data controls.
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 mt-4"
          >
            <span>{loading ? 'Saving consent...' : 'I Agree & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
