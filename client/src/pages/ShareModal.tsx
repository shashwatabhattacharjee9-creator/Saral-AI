import React, { useState } from 'react';
import { api } from '../api/client';
import { Share2, Copy, Check, Clock, X } from 'lucide-react';

interface Props {
  scanId: string;
  onClose: () => void;
}

export const ShareModal: React.FC<Props> = ({ scanId, onClose }) => {
  const [inviteeContact, setInviteeContact] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.request<{ shareUrl: string; expiresAt: string; inviteToken: string }>(
        `/api/v1/scans/${scanId}/share`,
        {
          method: 'POST',
          body: JSON.stringify({ inviteeContact: inviteeContact.trim() }),
        }
      );
      // Ensure shareUrl points to current browser location
      const localUrl = `${window.location.origin}/#share=${res.inviteToken}`;
      setShareUrl(localUrl);
      setExpiresAt(res.expiresAt);
    } catch (err: any) {
      setError(err.message || 'Failed to generate share link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-moss-700 mb-3">
          <div className="p-2 bg-moss-100 rounded-xl">
            <Share2 className="w-5 h-5 text-moss-700" />
          </div>
          <div>
            <h3 className="font-editorial text-xl font-bold text-stone-900">Share with Family</h3>
            <span className="text-xs text-stone-500">7-Day Time-Limited Link</span>
          </div>
        </div>

        <p className="text-xs text-stone-600 mb-5 leading-relaxed">
          Create a secure, read-only link scoped specifically to this prescription so a family member (e.g. sibling coordinating care) can listen to and review the translation.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {!shareUrl ? (
          <form onSubmit={handleGenerateShare} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Family Member Phone / Email (Optional note)
              </label>
              <input
                type="text"
                value={inviteeContact}
                onChange={(e) => setInviteeContact(e.target.value)}
                placeholder="e.g. Brother (+91...) or sister@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-moss-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>{loading ? 'Creating secure link...' : 'Generate 7-Day Share Link'}</span>
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-stone-100 rounded-xl flex items-center justify-between gap-2 border border-stone-200">
              <span className="text-xs font-mono text-stone-800 truncate select-all">
                {shareUrl}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-moss-600 hover:bg-moss-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>
                Link expires on {expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN') : '7 days'}.
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 border border-stone-300 rounded-xl text-stone-700 text-sm font-semibold hover:bg-stone-50 transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
