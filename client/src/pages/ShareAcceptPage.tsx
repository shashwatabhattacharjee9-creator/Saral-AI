import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Share2, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  token: string;
  onAccepted: (scanId: string) => void;
  onGoHome: () => void;
}

export const ShareAcceptPage: React.FC<Props> = ({ token, onAccepted, onGoHome }) => {
  const { user } = useAuth();
  const [meta, setMeta] = useState<{ scanId: string; isExpired: boolean; status: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrantInfo = async () => {
      try {
        setLoading(true);
        const res = await api.request<{ scanId: string; isExpired: boolean; status: string; expiresAt: string }>(
          `/api/v1/share-grants/${token}`
        );
        setMeta(res);
      } catch (err: any) {
        setError(err.message || 'Share link is invalid.');
      } finally {
        setLoading(false);
      }
    };
    fetchGrantInfo();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await api.request<{ scanId: string; status: string }>(
        `/api/v1/share-grants/${token}/accept`,
        { method: 'POST' }
      );
      onAccepted(res.scanId);
    } catch (err: any) {
      if (err.status === 410) {
        setError('This share link has expired.');
      } else {
        setError(err.message || 'Failed to accept share invitation.');
      }
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-stone-200 text-center animate-pulse">
        <div className="h-10 w-10 bg-stone-200 rounded-full mx-auto mb-4"></div>
        <div className="h-6 bg-stone-200 rounded w-48 mx-auto mb-2"></div>
        <div className="h-4 bg-stone-200 rounded w-64 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-stone-200 text-center">
        <div className="w-16 h-16 rounded-2xl bg-moss-50 text-moss-700 flex items-center justify-center mx-auto mb-5">
          <Share2 className="w-8 h-8" />
        </div>

        <h2 className="font-editorial text-2xl font-bold text-stone-900 mb-2">
          Shared Medical Prescription
        </h2>

        {error || meta?.isExpired || meta?.status === 'expired' ? (
          <div className="my-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm text-left flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Link Expired</span>
              <span>This shared prescription link has expired (7-day security limit). Please request the family member to generate a fresh link.</span>
            </div>
          </div>
        ) : (
          <div className="my-6 space-y-4 text-left bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="text-xs text-stone-600">
              A family member has shared a translated medical prescription with you. You will be able to review the medication details and listen to the audio explanation.
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 pt-2 border-t border-stone-200">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>Valid until {meta ? new Date(meta.expiresAt).toLocaleDateString('en-IN') : '7 days'}</span>
            </div>
          </div>
        )}

        {meta && !meta.isExpired && meta.status !== 'expired' ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3 px-4 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <span>{accepting ? 'Opening scan...' : 'Accept & View Prescription'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onGoHome}
            className="w-full py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition"
          >
            Go to Home
          </button>
        )}
      </div>
    </div>
  );
};
