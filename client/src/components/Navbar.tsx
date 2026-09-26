import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Users, Shield, Building2, LogOut, ArrowRightLeft, Sparkles } from 'lucide-react';

interface Props {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isOrgStaff = user.role === 'org_admin' || user.role === 'org_member';

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('profiles')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-moss-600 flex items-center justify-center text-white shadow-sm group-hover:bg-moss-700 transition">
            <HeartPulse className="w-6 h-6 text-moss-100" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-editorial text-2xl font-bold tracking-tight text-moss-900">
                Saral
              </span>
              <span className="font-editorial text-sm font-semibold text-clay-500">
                सरल
              </span>
            </div>
            <p className="text-[10px] text-stone-500 -mt-1 hidden sm:block">
              Prescription & Discharge Translator
            </p>
          </div>
        </div>

        {/* Navigation actions */}
        <nav className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => onNavigate('profiles')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition ${
              currentView === 'profiles' || currentView === 'profile_detail'
                ? 'bg-moss-100 text-moss-800'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Users className="w-4 h-4 text-moss-600" />
            <span>Family Profiles</span>
          </button>

          {isOrgStaff && (
            <button
              onClick={() => onNavigate('org_dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition ${
                currentView === 'org_dashboard'
                  ? 'bg-clay-100 text-clay-800'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Building2 className="w-4 h-4 text-clay-600" />
              <span>Org Caseload</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('data_settings')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition ${
              currentView === 'data_settings'
                ? 'bg-stone-200 text-stone-900'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            title="Privacy & Data Control Center"
          >
            <Shield className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">Data & Privacy</span>
          </button>

          <button
            onClick={() => onNavigate('landing')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition ${
              currentView === 'landing'
                ? 'bg-stone-200 text-stone-900'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            title="View Landing Page & Sarvam Build Story"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Build Story</span>
          </button>

          <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600 font-medium hidden md:inline bg-stone-100 px-2 py-1 rounded">
              {user.displayName || user.phoneNumber || user.email}
            </span>
            <button
              onClick={logout}
              className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
