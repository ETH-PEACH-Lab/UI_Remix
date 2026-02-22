import type { Middleware } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../config/api';

const TRACK_ACTION_TYPES = new Set([
  'userTracking/trackAction',
  'userTracking/trackMessageSent',
  'userTracking/trackUICardClicked',
  'userTracking/trackDrawingAction',
  'userTracking/trackIframeElementClicked',
  'userTracking/trackCodeEdited',
  'userTracking/trackModeChanged',
  'userTracking/startTracking',
  'userTracking/stopTracking',
]);

export const trackingMiddleware: Middleware = store => next => async (action: any) => {
  const result = next(action);
  const actionType = action.type || "unknown";

  try {
    if (!TRACK_ACTION_TYPES.has(actionType)) {
      return result;
    }

    const state = store.getState();
    const { isTracking, userName, currentSessionId, actions } = state.userTracking;
    const userEmail = state.userTracking.userName || userName;

    if (!isTracking || !userEmail) {
      return result;
    }

    const lastAction = actions[actions.length - 1];
    if (!lastAction) return result;

    const payload = {
      username: userEmail,
      session_name: currentSessionId || 'session_unknown',
      id: lastAction.id,
      timestamp: lastAction.timestamp,
      actionType: lastAction.actionType,
      userName: lastAction.userName,
      details: lastAction.details || {},
    };

    fetch(API_ENDPOINTS.TRACK_APPEND_ACTION, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error('append tracking action failed:', err);
    });
  } catch (err) {
    console.error('tracking middleware error:', err);
  }

  return result;
};


