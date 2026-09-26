import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Shield, Download, Trash2, Clock, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';

export const DataSettingsPage: React.FC = () => {
  const { user, consentStatus, logout } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<any | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [showErasureConfirm, setShowErasureConfirm] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [erasureSuccess, setErasureSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportData = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await api.request<{ exportData: any; downloadUrl: string }>('/api/v1/users/me/data-export');
      setExportData(res.exportData);
      setDownloadUrl(res.downloadUrl);

      // Trigger automatic browser download of JSON file
      const blob = new Blob([JSON.stringify(res.exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saral_health_data_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (err: any) {
      setError(err.message || 'Failed to export health data.');
    } finally {
      setExporting(false);
    }
  };

  const handleExecuteErasure = async () => {
    setErasing(true);
    setError(null);
    try {
      await api.request('/api/v1/users/me', { method: 'DELETE' });
      setErasureSuccess(true);
      setTimeout(() => {
        logout();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Account erasure failed.');
      setErasing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-editorial text-3xl font-bold text-stone-900">
          Privacy & Data Control Center
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Full compliance with India's Digital Personal Data Protection (DPDP) Act, 2023.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm">
          {error}
        </div>
      )}

      {erasureSuccess ? (
        <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-emerald-950">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h2 className="font-editorial text-2xl font-bold">Account & Medical Data Erased</h2>
          <p className="text-sm mt-2 max-w-md mx-auto text-emerald-800">
            All your profiles, prescription scans, and images have been permanently hard-deleted from our datastores. Regulatory proof logs have been anonymized. You will now be redirected.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Active DPDP Consents */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-moss-50 rounded-xl">
                <Shield className="w-5 h-5 text-moss-700" />
              </div>
              <h2 className="font-editorial text-xl font-bold text-stone-900">Active Consent Records</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-800 block">Core Health Data Processing</span>
                  <span className="text-stone-500 text-[11px]">DPDP Act Purpose Limitation</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  {consentStatus?.dataProcessing ? 'Active' : 'Missing'}
                </span>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-800 block">Third-Party AI Models</span>
                  <span className="text-stone-500 text-[11px]">Sarvam Vision, Translate, TTS</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  {consentStatus?.aiProcessingThirdParty ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Retention Policy Notice (Section 4.6) */}
          <div className="bg-parchment-100 rounded-2xl border border-parchment-300 p-6">
            <h3 className="font-bold text-sm text-stone-900 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-moss-700" />
              <span>Defined Data Retention Policy (Section 4.6)</span>
            </h3>
            <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-5">
              <li>
                <strong>30-Day Photo Purge:</strong> Uploaded prescription photos and raw audio are automatically deleted after 30 days to protect sensitive visual background data.
              </li>
              <li>
                <strong>Structured Results:</strong> Transcribed medicine schedules and plain-language translations remain available in your account until you choose to delete them.
              </li>
              <li>
                <strong>Regulatory Proof:</strong> Anonymized consent audit entries are preserved for compliance proof.
              </li>
            </ul>
          </div>

          {/* Section 3: Data Portability & Export */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-editorial text-lg font-bold text-stone-900">
                Download My Health Data
              </h2>
              <p className="text-xs text-stone-600 mt-0.5 max-w-md">
                Export an offline portable JSON archive containing all your family patient profiles, medication schedules, explanations, and consent audit logs.
              </p>
            </div>

            <button
              onClick={handleExportData}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition self-start sm:self-auto disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Exporting...' : 'Download Export (JSON)'}</span>
            </button>
          </div>

          {/* Section 4: Right to Erasure (DPDP Act Section 4.7 & AC5) */}
          <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-editorial text-lg font-bold text-rose-900">
                  Right to Erasure (Delete Account & All Data)
                </h2>
                <p className="text-xs text-stone-600 mt-0.5 max-w-md">
                  Permanently deletes your account, all family profiles, prescription scans, and images. This action cannot be reversed.
                </p>
              </div>

              <button
                onClick={() => setShowErasureConfirm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition self-start sm:self-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Erasure Confirmation Modal */}
      {showErasureConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="font-editorial text-xl font-bold text-center text-stone-900 mb-2">
              Confirm Account Erasure?
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed text-center mb-6">
              In accordance with Section 4.7 of Saral's DPDP Act compliance lifecycle, all your patient profiles, scans, uploaded prescription photos, and audio files will be completely and irreversibly removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowErasureConfirm(false)}
                className="flex-1 py-2.5 border border-stone-300 rounded-xl text-stone-700 text-xs sm:text-sm font-semibold hover:bg-stone-50 transition"
              >
                Keep My Data
              </button>
              <button
                onClick={handleExecuteErasure}
                disabled={erasing}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-50"
              >
                {erasing ? 'Erasing Data...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
