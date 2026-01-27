import api from '@/lib/axios';

export interface RequestOtpResponse {
  message: string;
}

export interface VerifyOtpResponse {
  token: string;
  profile: {
    id: string;
    mobileNumber: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export const customerAuthApi = {
  requestOtp: async (mobileNumber: string): Promise<void> => {
    await api.post('/api/v1/customer/auth/request-otp', { mobileNumber });
  },

  requestEmailOtp: async (email: string): Promise<void> => {
    await api.post('/api/v1/customer/auth/request-email-otp', { email });
  },

  verifyOtp: async (mobileNumber: string, otp: string): Promise<VerifyOtpResponse> => {
    const { data } = await api.post<VerifyOtpResponse>('/api/v1/customer/auth/verify-otp', {
      mobileNumber,
      otp,
    });
    return data;
  },

  verifyEmailOtp: async (email: string, otp: string): Promise<VerifyOtpResponse> => {
    const { data } = await api.post<VerifyOtpResponse>('/api/v1/customer/auth/verify-email-otp', {
      email,
      otp,
    });
    return data;
  },

  googleLogin: async (idToken: string): Promise<VerifyOtpResponse> => {
    const { data } = await api.post<VerifyOtpResponse>('/api/v1/customer/auth/google', {
      idToken,
    });
    return data;
  },
};
