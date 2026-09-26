import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../../shared/types';
import { api } from '../api/client';

interface ConsentStatus {
  dataProcessing: boolean;
  aiProcessingThirdParty: boolean;
  marketingCommunication: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  consentStatus: ConsentStatus | null;
  requestOtp: (phone: string) => Promise<{ success: boolean; devOtp?: string; message?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  grantConsent: (type: 'data_processing' | 'ai_processing_third_party' | 'marketing_communication', granted: boolean) => Promise<void>;
  refreshConsentStatus: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('saral_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);

  const refreshConsentStatus = async () => {
    try {
      const status = await api.request<ConsentStatus>('/api/v1/users/me/consent-status');
      setConsentStatus(status);
    } catch {
      setConsentStatus(null);
    }
  };

  useEffect(() => {
    if (api.getAccessToken()) {
      refreshConsentStatus().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const requestOtp = async (phoneNumber: string) => {
    const res = await api.request<{ status: string; message: string; devOtp?: string }>('/api/v1/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
    return { success: true, devOtp: res.devOtp, message: res.message };
  };

  const verifyOtp = async (phoneNumber: string, otpCode: string) => {
    const res = await api.request<{ accessToken: string; refreshToken: string; user: User }>('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otpCode }),
    });
    api.setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    localStorage.setItem('saral_user', JSON.stringify(res.user));
    await refreshConsentStatus();
    return true;
  };

  const loginWithEmail = async (email: string, password: string) => {
    const res = await api.request<{ accessToken: string; refreshToken: string; user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    api.setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    localStorage.setItem('saral_user', JSON.stringify(res.user));
    await refreshConsentStatus();
    return true;
  };

  const grantConsent = async (consentType: 'data_processing' | 'ai_processing_third_party' | 'marketing_communication', granted: boolean) => {
    await api.request('/api/v1/users/me/consent', {
      method: 'POST',
      body: JSON.stringify({ consentType, granted }),
    });
    await refreshConsentStatus();
  };

  const logout = () => {
    api.setTokens(null, null);
    setUser(null);
    setConsentStatus(null);
    localStorage.removeItem('saral_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        consentStatus,
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
