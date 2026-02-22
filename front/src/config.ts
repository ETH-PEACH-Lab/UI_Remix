// API endpoints.
// - Dev: call localhost:8000 directly
// - Prod: use same-origin relative paths

const isDev = import.meta.env.DEV;

export const API_ENDPOINTS = {
  CHAT: isDev ? 'http://127.0.0.1:8000/api/chat' : '/api/chat',
  GENERATE: isDev ? 'http://127.0.0.1:8000/api/generate' : '/api/generate',
  GLOBAL_RETRIEVE: isDev ? 'http://127.0.0.1:8000/api/globalRetrieve' : '/api/globalRetrieve',
  SPECIFIC_RETRIEVE: isDev ? 'http://127.0.0.1:8000/api/specificRetrieve' : '/api/specificRetrieve',
  LOGIN: isDev ? 'http://127.0.0.1:8000/api/login' : '/api/login',
};
