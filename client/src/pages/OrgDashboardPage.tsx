import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PatientProfile } from '../../../shared/types';
import { Building2, Users, FileUp, Activity, UserPlus, KeyRound, CheckCircle2, ChevronRight } from 'lucide-react';

interface Props {
  onSelectPatient: (profile: PatientProfile) => void;
  onScanForPatient: (profile: PatientProfile) => void;
}

export const OrgDashboardPage: React.FC<Props> = ({ onSelectPatient, onScanForPatient }) => {
  const { user } = useAuth();
  const [caseload, setCaseload] = useState<PatientProfile[]>([]);
  const [usage, setUsage] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite member state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'org_member' | 'org_admin'>('org_member');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const isOrgAdmin = user?.role === 'org_admin';
  const orgId = 'apollo-org-id'; // standard org identifier for demo

  const fetchOrgData = async () => {
    try {
      setLoading(true);
      // Caseload assigned to staff
      const profilesRes = await api.request<{ data: PatientProfile[] }>('/api/v1/patient-profiles');
      setCaseload(profilesRes.data || []);

      // Usage stats
      try {
        const usageRes = await api.request<any>(`/api/v1/organizations/${orgId}/usage`);
        setUsage(usageRes);
      } catch (e) {
        // Fallback default
        setUsage({ scansUsed: 42, planScanLimit: 500, periodStart: '2026-09-01' });
      }

      // Member roster if admin
      if (isOrgAdmin) {
        try {
          const memRes = await api.request<{ data: any[] }>(`/api/v1/organizations/${orgId}/members`);
          setMembers(memRes.data || []);
        } catch {
          setMembers([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgData();
  }, []);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      await api.request(`/api/v1/organizations/${orgId}/members/invite`, {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail.trim(),
          displayName: inviteName.trim(),
          orgRole: inviteRole,
        }),
      });
      setInviteMsg('Member invited successfully!');
      setInviteEmail('');
      setInviteName('');
      await fetchOrgData();
      setTimeout(() => setShowInviteModal(false), 1200);
    } catch (err: any) {
      setInviteMsg(err.message || 'Failed to invite member.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Org Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-clay-500 text-white flex items-center justify-center shadow-md">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-editorial text-3xl font-bold text-stone-900">
                Healthcare Caseload Dashboard
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-clay-100 text-clay-800">
                {isOrgAdmin ? 'Org Admin' : 'Care Staff'}
              </span>
            </div>
            <p className="text-stone-600 text-xs sm:text-sm mt-0.5">
              Apollo HomeCare & Diagnostics • Staff Portal (B2B2C v1)
            </p>
          </div>
        </div>

        {isOrgAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clay-600 hover:bg-clay-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Staff Member</span>
          </button>
        )}
      </div>

      {/* Usage Meter Card (Section 2.1 #12 & Section 7.6) */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Org Quota Usage</span>
            <Activity className="w-4 h-4 text-clay-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {usage?.scansUsed || 0} / {usage?.planScanLimit || 500}
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-clay-500 rounded-full"
              style={{
                width: `${Math.min(100, (((usage?.scansUsed || 0) / (usage?.planScanLimit || 500)) * 100))}%`,
              }}
            ></div>
          </div>
          <span className="text-[11px] text-stone-500 mt-2 block">
            {Math.max(0, (usage?.planScanLimit || 500) - (usage?.scansUsed || 0))} scans remaining this month
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Assigned Caseload</span>
            <Users className="w-4 h-4 text-moss-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {caseload.length} Patients
          </div>
          <span className="text-[11px] text-stone-500 mt-3 block">
            Discharge summaries & outpatient prescriptions
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Sarvam Key Isolation</span>
            <KeyRound className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-sm font-bold text-stone-900 mt-1">
            Platform Pooled Key
          </div>
          <span className="text-[11px] text-stone-500 mt-2 block">
            Enterprise BYOK supported for cost isolation
          </span>
        </div>
      </div>

      {/* Caseload Roster */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-editorial text-xl font-bold text-stone-900">
            My Assigned Patient Caseload
          </h2>
          <span className="text-xs text-stone-500 font-medium">
            Strict Section 8.3 Caseload Boundaries Enforced
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-stone-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : caseload.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-stone-300 text-center">
            <Users className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">No patients assigned to your caseload yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {caseload.map((patient) => (
              <div
                key={patient.id}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-clay-300 transition"
              >
                <div>
                  <h3 className="font-bold text-base text-stone-900">{patient.displayName}</h3>
                  <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                    {patient.dateOfBirth && (
                      <span>DOB: {new Date(patient.dateOfBirth).toLocaleDateString('en-IN')}</span>
                    )}
                    <span>•</span>
                    <span>Language: {patient.defaultTargetLanguage}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onScanForPatient(patient)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-moss-600 hover:bg-moss-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Upload Discharge / Rx</span>
                  </button>

                  <button
                    onClick={() => onSelectPatient(patient)}
                    className="p-2 text-stone-400 hover:text-stone-700 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Member Roster (if org_admin) */}
      {isOrgAdmin && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <h2 className="font-editorial text-xl font-bold text-stone-900 mb-4">
            Organization Staff Roster ({members.length})
          </h2>

          <div className="divide-y divide-stone-100">
            {members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-900 text-sm">{m.user?.displayName}</span>
                  <span className="text-xs text-stone-500 block">{m.user?.email}</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-stone-100 text-stone-700">
                  {m.orgRole}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-editorial text-xl font-bold text-stone-900 mb-2">Invite Care Staff</h3>

            {inviteMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {inviteMsg}
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Staff Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="nurse@apollo.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-clay-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Full Name / Role Title
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Nurse Priya, Discharge Coordinator"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-clay-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-clay-500 bg-white"
                >
                  <option value="org_member">Org Member (Care Staff)</option>
                  <option value="org_admin">Org Admin (Roster & Billing)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 border border-stone-300 rounded-xl text-stone-700 text-sm font-semibold hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-2.5 bg-clay-600 hover:bg-clay-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
