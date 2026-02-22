// App constants.
export const STORAGE_KEYS = {
  IS_AUTHENTICATED: 'isAuthenticated',
  USER_EMAIL: 'userEmail',
} as const;

export const APP_CONFIG = {
  IFRAME_RETRY_COUNT: 20,
  IFRAME_RETRY_DELAY: 50,
  UPDATE_DEBOUNCE_DELAY: 500,
} as const;

export const DEFAULT_CREDENTIALS = {
  USERNAME: 'test',
  EMAIL: 'test@example.com',
  PASSWORD: '123456',
} as const;

export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  APP: '/app',
} as const;

export const DEFAULT_ASSISTANT_MESSAGE = {
  messageId: 1,
  sender: "assistant" as const,
  content: "Hi, I am your assistant for building UI pages. Please tell me what kind of mobile UI you are imagining -- like a profile page with a photo and title or a product list with filters, and I will help you build it. You can drag some supporting files to the chat box, for example the content should be shown.\nI'll generate a first draft based on real app examples. You can refine and iterate from there.",
  type: "message" as const,
};

export const INITIAL_HTML_URL = "/test/test.html";

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
  INVALID_INPUT: 'Invalid input. Please check your data and try again.',
} as const; 