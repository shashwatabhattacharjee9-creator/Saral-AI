import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Phone, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { requestOtp, verifyOtp, loginWithEmail } = useAuth();

  const [mode, setMode] = useState<'otp' | 'email'>('otp');
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await requestOtp(phoneNumber.trim());
      if (res.devOtp) setDevOtp(res.devOtp);
      setOtpStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(phoneNumber.trim(), otpCode.trim());
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const prefillOrgAdmin = () => {
    setMode('email');
    setEmail('admin@apollohomecare.com');
    setPassword('Admin@12345');
  };

  const prefillOrgStaff = () => {
    setMode('email');
    setEmail('staff@apollohomecare.com');
    setPassword('Staff@12345');
  };

  return (
    <div className="min-h-screen bg-parchment-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-moss-600 text-white shadow-md mb-4">
          <HeartPulse className="w-10 h-10 text-moss-100" />
        </div>
        <h1 className="font-editorial text-4xl font-bold text-moss-900 tracking-tight">
          Saral <span className="text-clay-500 font-normal">सरल</span>
        </h1>
        <p className="mt-2 text-sm text-stone-600 max-w-sm mx-auto">
          Medical prescriptions & discharge summaries, translated into clear words and spoken audio for Indian families.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-stone-200">
          {/* Mode Switcher */}
          <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => {
                setMode('otp');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                mode === 'otp' ? 'bg-white text-moss-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Phone (OTP)
            </button>
            <button
              onClick={() => {
                setMode('email');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                mode === 'email' ? 'bg-white text-moss-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Healthcare Org Staff
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Phone OTP Mode */}
          {mode === 'otp' && (
            <div>
              {otpStep === 'request' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                      Phone Number (India / NRI)
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+919876543210"
                        required
                        className="block w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-moss-500 focus:border-moss-500 text-stone-900 text-sm font-medium tracking-wide"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1.5">
                      Enter with country code (e.g. +91 98765 43210). We will send a 6-digit OTP.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center pb-1">
                    <span className="text-xs text-stone-500">OTP sent to </span>
                    <span className="text-xs font-semibold text-stone-800">{phoneNumber}</span>
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="text-xs text-moss-600 hover:underline ml-2"
                    >
                      Change
                    </button>
                  </div>

                  {devOtp && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        Dev OTP received: <span className="font-mono font-bold text-sm tracking-wider">{devOtp}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                      6-Digit Security Code
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        required
                        className="block w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 text-center font-mono text-xl tracking-widest text-stone-900 focus:ring-2 focus:ring-moss-500 focus:border-moss-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full py-3 px-4 rounded-xl bg-moss-600 hover:bg-moss-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{loading ? 'Verifying...' : 'Sign In & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Org Staff Mode */}
          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Staff Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@apollohomecare.com"
                    required
                    className="block w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-moss-500 text-stone-900 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-moss-500 text-stone-900 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-clay-600 hover:bg-clay-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Logging in...' : 'Sign In as Healthcare Staff'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
                <span className="text-[11px] text-stone-500 text-center font-medium">Quick Demo Accounts:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={prefillOrgStaff}
                    className="flex-1 py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition text-center"
                  >
                    Nurse Priya (Staff)
                  </button>
                  <button
                    type="button"
                    onClick={prefillOrgAdmin}
                    className="flex-1 py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition text-center"
                  >
                    Dr. Ramesh (Admin)
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-stone-500">
              <ShieldCheck className="w-4 h-4 text-moss-600" />
              <span>Compliant with India's DPDP Act, 2023</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
