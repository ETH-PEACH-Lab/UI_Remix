import { STORAGE_KEYS } from '../config/constants';
import type { AuthState } from '../types';

export const authStorage = {
  getAuthState: (): AuthState => {
    const isAuthenticated = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
    const userEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '';
    
    return {
      isAuthenticated,
      userEmail,
    };
  },

  setAuthState: (authState: AuthState): void => {
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, authState.isAuthenticated.toString());
    if (authState.userEmail) {
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, authState.userEmail);
    }
  },

  clearAuth: (): void => {
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  },
};

export const storage = {
  get: (key: string): string | null => {
    return localStorage.getItem(key);
  },

  set: (key: string, value: string): void => {
    localStorage.setItem(key, value);
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  },
}; 