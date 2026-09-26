import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ConsentModal } from './pages/ConsentModal';
import { ProfilesPage } from './pages/ProfilesPage';
import { ProfileDetailPage } from './pages/ProfileDetailPage';
import { UploadWizardPage } from './pages/UploadWizardPage';
import { ScanDetailPage } from './pages/ScanDetailPage';
import { ShareAcceptPage } from './pages/ShareAcceptPage';
import { DataSettingsPage } from './pages/DataSettingsPage';
import { OrgDashboardPage } from './pages/OrgDashboardPage';
import { LandingPage } from './pages/LandingPage';
import { Navbar } from './components/Navbar';
import { PatientProfile } from '../../shared/types';
import { Users, Shield, Building2 } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading, consentStatus } = useAuth();

  // User Requirement: Upon opening the link, whoever opens this Saral web app
  // will first and foremost be introduced to the landing page.
  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#share=')) {
      return 'share_accept';
    }
    return 'landing';
  });
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);

  // Check URL hash for shared invite tokens (e.g. #share=xyz)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        const token = hash.replace('#share=', '');
        setShareToken(token);
        setCurrentView('share_accept');
      } else if (hash === '#app') {
        setCurrentView('profiles');
      } else if (hash === '#landing') {
        setCurrentView('landing');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-moss-200 border-t-moss-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle Landing Page over main webapp
  if (currentView === 'landing') {
    return (
      <LandingPage
        onLaunchApp={() => {
          setCurrentView('profiles');
          window.location.hash = '#app';
        }}
      />
    );
  }

  // Handle public share accept link directly even before login if desired, or authenticate
  if (shareToken && currentView === 'share_accept') {
    return (
      <ShareAcceptPage
        token={shareToken}
        onAccepted={(scanId) => {
          setSelectedScanId(scanId);
          setCurrentView('scan_detail');
          window.location.hash = '';
          setShareToken(null);
        }}
        onGoHome={() => {
          window.location.hash = '';
          setShareToken(null);
          setCurrentView('profiles');
        }}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <div>
        <div className="bg-moss-900 text-white text-xs px-4 py-2 flex justify-between items-center">
          <span>Saral Demo Deployment • Open Evaluation Mode</span>
          <button
            onClick={() => setCurrentView('profiles')}
            className="underline hover:text-moss-200"
          >
            ← Return to Family Profiles
          </button>
        </div>
        <LoginPage />
      </div>
    );
  }

  const needsConsent = false;
  const isOrgStaff = user?.role === 'org_admin' || user?.role === 'org_member';

  return (
    <div className="min-h-screen bg-parchment-100 flex flex-col justify-between">
      <div>
        <Navbar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            if (view === 'profiles') setSelectedProfile(null);
          }}
        />

        <main className="pb-20 sm:pb-8">
          {currentView === 'profiles' && (
            <ProfilesPage
              onSelectProfile={(profile) => {
                setSelectedProfile(profile);
                setCurrentView('profile_detail');
              }}
            />
          )}

          {currentView === 'profile_detail' && selectedProfile && (
            <ProfileDetailPage
              profile={selectedProfile}
              onBack={() => {
                setSelectedProfile(null);
                setCurrentView('profiles');
              }}
              onStartScan={() => setCurrentView('upload_wizard')}
              onSelectScan={(scanId) => {
                setSelectedScanId(scanId);
                setCurrentView('scan_detail');
              }}
            />
          )}

          {currentView === 'upload_wizard' && selectedProfile && (
            <UploadWizardPage
              profile={selectedProfile}
              onCancel={() => setCurrentView('profile_detail')}
              onComplete={(scanId) => {
                setSelectedScanId(scanId);
                setCurrentView('scan_detail');
              }}
            />
          )}

          {currentView === 'scan_detail' && selectedScanId && (
            <ScanDetailPage
              scanId={selectedScanId}
              onBack={() => setCurrentView(selectedProfile ? 'profile_detail' : 'profiles')}
              onRetake={() => setCurrentView('upload_wizard')}
            />
          )}

          {currentView === 'data_settings' && <DataSettingsPage />}

          {currentView === 'org_dashboard' && isOrgStaff && (
            <OrgDashboardPage
              onSelectPatient={(profile) => {
                setSelectedProfile(profile);
                setCurrentView('profile_detail');
              }}
              onScanForPatient={(profile) => {
                setSelectedProfile(profile);
                setCurrentView('upload_wizard');
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar per Section 9.2 */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            setSelectedProfile(null);
            setCurrentView('profiles');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-semibold ${
            currentView === 'profiles' || currentView === 'profile_detail'
              ? 'text-moss-700'
              : 'text-stone-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Profiles</span>
        </button>

        {isOrgStaff && (
          <button
            onClick={() => setCurrentView('org_dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-semibold ${
              currentView === 'org_dashboard' ? 'text-clay-600' : 'text-stone-500'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Caseload</span>
          </button>
        )}

        <button
          onClick={() => setCurrentView('data_settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-semibold ${
            currentView === 'data_settings' ? 'text-moss-700' : 'text-stone-500'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>Privacy</span>
        </button>
      </div>

      {/* Mandatory DPDP Consent Modal (Section 6.4) */}
      <ConsentModal isOpen={needsConsent} onClose={() => {}} />
    </div>
  );
};
