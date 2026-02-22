import type { APIEndpoints } from '../types/api';

// API endpoint configuration.
// - Dev: call localhost:8000 directly
// - Prod: use same-origin relative paths

const isDev = import.meta.env.DEV;

export const API_ENDPOINTS: APIEndpoints = {
  CHAT: isDev ? 'http://127.0.0.1:8000/api/chat' : '/api/chat',
  GENERATE: isDev ? 'http://127.0.0.1:8000/api/generate' : '/api/generate',
  GLOBAL_RETRIEVE: isDev ? 'http://127.0.0.1:8000/api/globalRetrieve' : '/api/globalRetrieve',
  SPECIFIC_RETRIEVE: isDev ? 'http://127.0.0.1:8000/api/specificRetrieve' : '/api/specificRetrieve',
  BASELINE: isDev ? 'http://127.0.0.1:8000/api/baseline' : '/api/baseline',
  LOGIN: isDev ? 'http://127.0.0.1:8000/api/login' : '/api/login',
  TRACK_APPEND_ACTION: isDev ? 'http://127.0.0.1:8000/api/append-tracking-action' : '/api/append-tracking-action',
};

console.log(
  '🔧 [Config] API endpoints:',
  isDev ? 'dev (localhost:8000)' : 'prod (same-origin relative paths)'
);