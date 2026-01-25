import api from '@/lib/axios';

export interface RequestOtpResponse {
  message: string;
}

export interface VerifyOtpResponse {
  token: string;
  profile: {
    id: string;
    mobileNumber: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export const customerAuthApi = {
  requestOtp: async (mobileNumber: string): Promise<void> => {
    await api.post('/api/v1/customer/auth/request-otp', { mobileNumber });
  },

  verifyOtp: async (mobileNumber: string, otp: string): Promise<VerifyOtpResponse> => {
    const { data } = await api.post<VerifyOtpResponse>('/api/v1/customer/auth/verify-otp', {
      mobileNumber,
      otp,
    });
    return data;
  },
};
