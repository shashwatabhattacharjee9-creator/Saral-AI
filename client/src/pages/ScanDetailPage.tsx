import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ScanResponse, SUPPORTED_LANGUAGES } from '../../../shared/types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { SafetyFlagsList } from '../components/SafetyFlagsList';
import { AudioPlayer } from '../components/AudioPlayer';
import { MedicinesTable } from '../components/MedicinesTable';
import { ShareModal } from './ShareModal';
import {
  ArrowLeft,
  Share2,
  Calendar,
  Languages,
  BookOpen,
  FileCheck2,
  RotateCcw,
} from 'lucide-react';

interface Props {
  scanId: string;
  onBack: () => void;
  onRetake: () => void;
}

export const ScanDetailPage: React.FC<Props> = ({ scanId, onBack, onRetake }) => {
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'translated' | 'canonical'>('translated');
  const [showShareModal, setShowShareModal] = useState(false);

  const fetchScan = async () => {
    try {
      setLoading(true);
      const res = await api.request<ScanResponse>(`/api/v1/scans/${scanId}`);
      setScan(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load scan results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
  }, [scanId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-6 w-32 bg-stone-200 rounded animate-pulse"></div>
        <div className="h-28 bg-stone-200 rounded-2xl animate-pulse"></div>
        <div className="h-40 bg-stone-200 rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-stone-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !scan || !scan.result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-md">
          <h2 className="font-editorial text-xl font-bold text-stone-900 mb-2">Scan Result Unavailable</h2>
          <p className="text-sm text-stone-600 mb-6">{error || 'Could not find details for this scan.'}</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-moss-600 text-white rounded-xl text-sm font-semibold hover:bg-moss-700 transition"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const { result } = scan;
  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === scan.targetLanguageCode);
  const langLabel = langMeta ? `${langMeta.label} (${langMeta.nativeLabel})` : scan.targetLanguageCode;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onRetake}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Scan</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-moss-600 hover:bg-moss-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share with Family</span>
          </button>
        </div>
      </div>

      {/* Persistent Medical Reading Aid Disclaimer (Section 9.7) */}
      <DisclaimerBanner />

      {/* Scan Summary Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-editorial text-2xl font-bold text-stone-900 capitalize">
              {scan.documentType.replace('_', ' ')} Explanation
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              {new Date(scan.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-stone-400" />
              Language: {langLabel}
            </span>
            <span>•</span>
            <span>{scan.pageCount} page(s)</span>
          </div>
        </div>

        {/* OCR Confidence Badge (Section 5.1 / 10.2) */}
        <div>
          <ConfidenceBadge confidence={result.ocrConfidence} onRetake={onRetake} />
        </div>
      </div>

      {/* Safety Flags (Section 5.4 / AC8) */}
      <SafetyFlagsList flags={result.safetyFlags} />

      {/* Spoken Audio Player (Section 9.7) */}
      <AudioPlayer
        scanId={scan.scanId}
        audioUrl={result.audioUrl}
        onAudioRetried={fetchScan}
      />

      {/* Bilingual Explanations Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden my-5">
        <div className="flex border-b border-stone-200 bg-stone-50/70">
          <button
            onClick={() => setActiveTab('translated')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'translated'
                ? 'border-moss-600 text-moss-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Languages className="w-4 h-4 text-moss-600" />
            <span>Translated Explanation ({langLabel})</span>
          </button>

          <button
            onClick={() => setActiveTab('canonical')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'canonical'
                ? 'border-moss-600 text-moss-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-stone-500" />
            <span>Canonical English Original</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'translated' ? (
            <div>
              {result.translatedExplanation ? (
                <p
                  lang={scan.targetLanguageCode}
                  className="font-serif text-stone-800 text-base sm:text-lg leading-relaxed whitespace-pre-line"
                >
                  {result.translatedExplanation}
                </p>
              ) : (
                <div className="p-4 bg-amber-50 rounded-xl text-amber-900 text-xs sm:text-sm">
                  Indic translation was degraded or English was selected. Showing canonical English explanation below:
                  <p className="mt-2 text-stone-800 font-serif leading-relaxed">
                    {result.plainExplanationEn}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="font-serif text-stone-800 text-base sm:text-lg leading-relaxed whitespace-pre-line">
              {result.plainExplanationEn}
            </p>
          )}
        </div>
      </div>

      {/* Extracted Medicines Table */}
      <MedicinesTable medicines={result.medicines} />

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal scanId={scan.scanId} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
};
