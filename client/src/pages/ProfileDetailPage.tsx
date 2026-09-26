import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PatientProfile, ScanResponse, SUPPORTED_LANGUAGES } from '../../../shared/types';
import { Camera, Calendar, ArrowLeft, FileText, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';

interface Props {
  profile: PatientProfile;
  onBack: () => void;
  onStartScan: () => void;
  onSelectScan: (scanId: string) => void;
}

export const ProfileDetailPage: React.FC<Props> = ({ profile, onBack, onStartScan, onSelectScan }) => {
  const [scans, setScans] = useState<ScanResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const res = await api.request<{ data: any[] }>(`/api/v1/patient-profiles/${profile.id}/scans`);
      setScans(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [profile.id]);

  const langLabel = SUPPORTED_LANGUAGES.find((l) => l.code === profile.defaultTargetLanguage)?.label || 'Hindi';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-moss-700 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all family members</span>
      </button>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-moss-600 text-white flex items-center justify-center font-editorial text-2xl font-bold shadow-xs">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900">
              {profile.displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1.5">
              {profile.dateOfBirth && (
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  DOB: {new Date(profile.dateOfBirth).toLocaleDateString('en-IN')}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-parchment-200 text-moss-800 font-semibold text-[11px]">
                Language: {langLabel}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onStartScan}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition group self-start sm:self-auto"
        >
          <Camera className="w-5 h-5 group-hover:scale-110 transition" />
          <span>Scan a Prescription</span>
        </button>
      </div>

      {/* History section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-editorial text-xl font-bold text-stone-900">Prescription & Discharge History</h2>
          <span className="text-xs text-stone-500 font-medium">{scans.length} documents</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-stone-200/60 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center">
            <FileText className="w-10 h-10 text-stone-400 mx-auto mb-3" />
            <h3 className="font-bold text-base text-stone-800">No scans yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-5">
              Take or upload a photo of a doctor's prescription note to get an instant translated explanation.
            </p>
            <button
              onClick={onStartScan}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <Camera className="w-4 h-4" />
              <span>Scan First Prescription</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => {
              const currentScanId = (scan as any).id || scan.scanId;
              const isCompleted = scan.status === 'completed';
              const isProcessing = scan.status === 'processing' || scan.status === 'queued';

              return (
                <div
                  key={currentScanId}
                  onClick={() => onSelectScan(currentScanId)}
                  className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-xs hover:border-moss-400 hover:shadow-sm transition cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCompleted
                          ? 'bg-moss-50 text-moss-700'
                          : isProcessing
                          ? 'bg-amber-50 text-amber-600 animate-pulse'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-moss-600" />
                      ) : isProcessing ? (
                        <Clock className="w-5 h-5 text-amber-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm capitalize">
                          {scan.documentType.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-semibold capitalize bg-stone-100 text-stone-600">
                          {scan.targetLanguageCode}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Uploaded {formatDate(scan.createdAt)} • {scan.pageCount} {scan.pageCount === 1 ? 'page' : 'pages'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isProcessing
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {scan.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-moss-600 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
