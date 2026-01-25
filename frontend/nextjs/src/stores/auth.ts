import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface UserProfile {
  id: string;
  mobileNumber: string;
  displayName: string;
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => {
        // Store in cookie for server-side checks if needed
        Cookies.set('fg_customer_token', token, { expires: 30 });
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        Cookies.remove('fg_customer_token');
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'foodgrid-customer-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
