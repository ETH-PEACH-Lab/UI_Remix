import type { Model } from '../types/common';
import { availableModels } from '../config/models';

// Small helper utilities used across the app.
export const modelUtils = {
  getById: (id: string): Model | undefined => {
    return availableModels.find(model => model.id === id);
  },

  filterByProvider: (provider: 'openai' | 'anthropic'): Model[] => {
    return availableModels.filter(model => model.provider === provider);
  },

  getAll: (): Model[] => {
    return availableModels;
  },
};

export const errorUtils = {
  parseHttpError: (error: Error): string => {
    const message = error.message;
    
    if (message.includes('API key')) {
      return 'API key error. Please check your API key configuration.';
    } else if (message.includes('400')) {
      return 'Request error. Please check your input and try again.';
    } else if (message.includes('401') || message.includes('403')) {
      return 'Authentication error. Please verify your API keys.';
    } else if (message.includes('429')) {
      return 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (message.includes('500')) {
      return 'Server error. Please try again later.';
    }
    
    return 'Failed to send message. Please try again.';
  },

  createErrorResponse: (error: unknown): string => {
    if (error instanceof Error) {
      return errorUtils.parseHttpError(error);
    }
    return 'An unexpected error occurred.';
  },
};

export const validationUtils = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidApiKey: (key: string, provider: 'openai' | 'anthropic'): boolean => {
    if (!key?.trim()) return false;
    
    if (provider === 'openai') {
      return key.startsWith('sk-') && key.length > 10;
    } else if (provider === 'anthropic') {
      return key.startsWith('sk-ant-') && key.length > 15;
    }
    
    return false;
  },

  isValidPassword: (password: string): boolean => {
    return password.length >= 6;
  },
};

export const textUtils = {
  truncate: (text: string, length: number = 100): string => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  sanitize: (text: string): string => {
    return text.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
  },

  maskSensitive: (text: string, visibleChars: number = 4): string => {
    if (text.length <= visibleChars) return text;
    return text.substring(0, visibleChars) + '*'.repeat(text.length - visibleChars);
  },
};

export const timeUtils = {
  formatTimestamp: (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  },

  now: (): number => {
    return Date.now();
  },

  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
}; 