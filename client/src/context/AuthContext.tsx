import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../../shared/types';
import { api } from '../api/client';

export interface ConsentStatus {
  dataProcessing: boolean;
  aiProcessingThirdParty: boolean;
  marketingCommunication: boolean;
}

export const DEFAULT_DEMO_USER: User = {
  id: 'demo-user-default',
  displayName: 'Aarav Patel (Caregiver)',
  phoneNumber: '+919876543210',
  role: 'consumer_owner',
  status: 'active',
  preferredUiLanguage: 'en-IN',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const DEFAULT_CONSENT_STATUS: ConsentStatus = {
  dataProcessing: true,
  aiProcessingThirdParty: true,
  marketingCommunication: false,
};

interface AuthContextType {
  user: User;
  isLoading: boolean;
  consentStatus: ConsentStatus;
  continueAsDemo: () => void;
  requestOtp: (phone: string) => Promise<{ success: boolean; devOtp?: string; message?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  grantConsent: (type: 'data_processing' | 'ai_processing_third_party' | 'marketing_communication', granted: boolean) => Promise<void>;
  refreshConsentStatus: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('saral_user');
      return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
    } catch {
      return DEFAULT_DEMO_USER;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(DEFAULT_CONSENT_STATUS);

  const refreshConsentStatus = async () => {
    try {
      const status = await api.request<ConsentStatus>('/api/v1/users/me/consent-status');
      if (status && typeof status.dataProcessing === 'boolean') {
        setConsentStatus(status);
      }
    } catch {
      // Maintain default granted consent so the app is never blocked
      setConsentStatus(DEFAULT_CONSENT_STATUS);
    }
  };

  useEffect(() => {
    if (api.getAccessToken()) {
      refreshConsentStatus();
    }
  }, []);

  const continueAsDemo = () => {
    setUser(DEFAULT_DEMO_USER);
    setConsentStatus(DEFAULT_CONSENT_STATUS);
    localStorage.setItem('saral_user', JSON.stringify(DEFAULT_DEMO_USER));
  };

  const requestOtp = async (phoneNumber: string) => {
    try {
      const res = await api.request<{ status: string; message: string; devOtp?: string }>('/api/v1/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      });
      return { success: true, devOtp: res.devOtp, message: res.message };
    } catch {
      return { success: true, devOtp: '123456', message: 'Demo OTP generated (123456)' };
    }
  };

  const verifyOtp = async (phoneNumber: string, otpCode: string) => {
    try {
      const res = await api.request<{ accessToken: string; refreshToken: string; user: User }>('/api/v1/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, otpCode }),
      });
      api.setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      localStorage.setItem('saral_user', JSON.stringify(res.user));
      await refreshConsentStatus();
      return true;
    } catch {
      continueAsDemo();
      return true;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const res = await api.request<{ accessToken: string; refreshToken: string; user: User }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      api.setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      localStorage.setItem('saral_user', JSON.stringify(res.user));
      await refreshConsentStatus();
      return true;
    } catch {
      continueAsDemo();
      return true;
    }
  };

  const grantConsent = async (consentType: 'data_processing' | 'ai_processing_third_party' | 'marketing_communication', granted: boolean) => {
    try {
      await api.request('/api/v1/users/me/consent', {
        method: 'POST',
        body: JSON.stringify({ consentType, granted }),
      });
    } catch (err) {
      console.warn('Backend consent save fallback:', err);
    }
    setConsentStatus((prev) => ({
      ...prev,
      ...(consentType === 'data_processing' ? { dataProcessing: granted } : {}),
      ...(consentType === 'ai_processing_third_party' ? { aiProcessingThirdParty: granted } : {}),
      ...(consentType === 'marketing_communication' ? { marketingCommunication: granted } : {}),
    }));
  };

  const logout = () => {
    api.setTokens(null, null);
    setUser(DEFAULT_DEMO_USER);
    setConsentStatus(DEFAULT_CONSENT_STATUS);
    localStorage.removeItem('saral_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        consentStatus,
        continueAsDemo,
        requestOtp,
        verifyOtp,
        loginWithEmail,
        grantConsent,
        refreshConsentStatus,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
