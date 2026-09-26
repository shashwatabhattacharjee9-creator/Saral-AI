import { StandardErrorEnvelope } from '../../../shared/types';

export class ApiError extends Error {
  code: string;
  requestId: string;
  status: number;

  constructor(status: number, envelope: StandardErrorEnvelope['error']) {
    super(envelope.message || 'API request failed');
    this.name = 'ApiError';
    this.code = envelope.code;
    this.requestId = envelope.requestId;
    this.status = status;
  }
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('saral_access_token');
    this.refreshToken = localStorage.getItem('saral_refresh_token');
  }

  setTokens(access: string | null, refresh: string | null) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (access) localStorage.setItem('saral_access_token', access);
    else localStorage.removeItem('saral_access_token');

    if (refresh) localStorage.setItem('saral_refresh_token', refresh);
    else localStorage.removeItem('saral_refresh_token');
  }

  getAccessToken() {
    return this.accessToken;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (response.status === 401 && !isRetry && this.refreshToken) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        return this.request<T>(endpoint, options, true);
      }
    }

    const contentType = response.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errEnvelope = data?.error || {
        code: `http_${response.status}`,
        message: typeof data === 'string' ? data : 'An error occurred',
        requestId: response.headers.get('x-request-id') || 'unknown',
      };
      throw new ApiError(response.status, errEnvelope);
    }

    return data as T;
  }

  private async refreshTokens(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (!res.ok) {
        this.setTokens(null, null);
        return false;
      }
      const data = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      this.setTokens(null, null);
      return false;
    }
  }
}

export const api = new ApiClient();
