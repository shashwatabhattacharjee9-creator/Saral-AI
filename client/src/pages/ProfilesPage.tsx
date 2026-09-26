import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PatientProfile, SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../../../shared/types';
import { Users, UserPlus, Calendar, Globe, ChevronRight, Heart } from 'lucide-react';

interface Props {
  onSelectProfile: (profile: PatientProfile) => void;
}

export const ProfilesPage: React.FC<Props> = ({ onSelectProfile }) => {
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguageCode>('hi-IN');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.request<{ data: PatientProfile[] }>('/api/v1/patient-profiles');
      setProfiles(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const newProf = await api.request<PatientProfile>('/api/v1/patient-profiles', {
        method: 'POST',
        body: JSON.stringify({
          displayName: displayName.trim(),
          dateOfBirth: dateOfBirth || null,
          defaultTargetLanguageCode: defaultLanguage,
        }),
      });
      setShowAddModal(false);
      setDisplayName('');
      setDateOfBirth('');
      await fetchProfiles();
      onSelectProfile(newProf);
    } catch (err: any) {
      setError(err.message || 'Failed to create patient profile.');
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (dob?: string | null) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-editorial text-3xl font-bold text-moss-900">Family Members</h1>
          <p className="text-stone-600 text-sm mt-1">
            Manage medical scans and translated explanations for each family member.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-sm transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Profile List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-stone-200/60 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-moss-50 rounded-2xl flex items-center justify-center text-moss-600 mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-editorial text-xl font-bold text-stone-900">No family profiles yet</h3>
          <p className="text-stone-600 text-sm max-w-sm mx-auto mt-1 mb-6">
            Add a family member like "Amma", "Father", or yourself to organize and translate medical prescriptions.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Family Member</span>
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {profiles.map((profile) => {
            const age = calculateAge(profile.dateOfBirth);
            const langLabel = SUPPORTED_LANGUAGES.find((l) => l.code === profile.defaultTargetLanguage)?.label || 'Hindi';

            return (
              <div
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md hover:border-moss-400 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-parchment-200 text-moss-700 flex items-center justify-center font-editorial text-xl font-bold group-hover:bg-moss-100 group-hover:text-moss-800 transition">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-stone-900 group-hover:text-moss-700 transition">
                      {profile.displayName}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                      {age !== null && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {age} yrs old {age >= 65 && <span className="text-clay-600 font-semibold">(Senior)</span>}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-stone-400" />
                        {langLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-moss-50 group-hover:text-moss-600 transition">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h2 className="text-xl font-bold font-editorial text-stone-900 mb-1">Add Family Member</h2>
            <p className="text-xs text-stone-500 mb-5">
              Enter a familiar nickname (e.g. "Amma", "Father", "Rohit").
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Nickname or Name *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Amma, Dad, Grandmother"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-moss-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Date of Birth (Optional)
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-moss-500"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Used solely to tune explanation tone (e.g. shorter audio sentences for seniors 65+).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Default Spoken Language
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value as SupportedLanguageCode)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-moss-500 bg-white"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} ({lang.nativeLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-stone-300 rounded-xl text-stone-700 text-sm font-semibold hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !displayName.trim()}
                  className="flex-1 py-2.5 bg-moss-600 hover:bg-moss-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
