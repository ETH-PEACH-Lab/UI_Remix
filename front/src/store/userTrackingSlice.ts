import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// User action tracking types.
export type UserActionType =
  | 'message_sent'
  | 'ui_card_clicked'
  | 'ui_card_selected'
  | 'ui_card_enlarged'
  | 'drawing_started'
  | 'drawing_ended'
  | 'drawing_saved'
  | 'iframe_element_clicked'
  | 'mode_changed'
  | 'code_edited'
  | 'tag_selected'
  | 'tag_deselected'
  | 'session_started'
  | 'session_ended';

export interface UserAction {
  id: string;
  timestamp: number;
  actionType: UserActionType;
  userName: string;
  details: {
    message?: string;
    messageMode?: string;
    cardId?: string;
    cardTitle?: string;
    elementXPath?: string;
    elementTag?: string;
    drawingData?: string;
    codeContent?: string;
    mode?: string;
    previousValue?: string;
    newValue?: string;
    sessionId?: string;
    duration?: number;
    coordinates?: {
      x: number;
      y: number;
    };
    metadata?: Record<string, any>;
  };
}

export interface UserTrackingState {
  actions: UserAction[];
  currentSessionId: string | null;
  isTracking: boolean;
  userName: string;
  sessionStartTime: number | null;
}

const initialState: UserTrackingState = {
  actions: [],
  currentSessionId: null,
  isTracking: false,
  userName: '',
  sessionStartTime: null,
};

// Helpers for unique IDs.
const generateActionId = (): string => {
  return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const userTrackingSlice = createSlice({
  name: 'userTracking',
  initialState,
  reducers: {
    startTracking: (state, action: PayloadAction<{ userName: string }>) => {
      const sessionId = generateSessionId();
      const timestamp = Date.now();
      
      state.isTracking = true;
      state.userName = action.payload.userName;
      state.currentSessionId = sessionId;
      state.sessionStartTime = timestamp;
      
      const sessionStartAction: UserAction = {
        id: generateActionId(),
        timestamp,
        actionType: 'session_started',
        userName: action.payload.userName,
        details: {
          sessionId,
        }
      };
      
      state.actions.push(sessionStartAction);
    },

    stopTracking: (state) => {
      if (state.isTracking && state.currentSessionId) {
        const timestamp = Date.now();
        const duration = state.sessionStartTime ? timestamp - state.sessionStartTime : 0;
        
        const sessionEndAction: UserAction = {
          id: generateActionId(),
          timestamp,
          actionType: 'session_ended',
          userName: state.userName,
          details: {
            sessionId: state.currentSessionId,
            duration,
          }
        };
        
        state.actions.push(sessionEndAction);
      }
      
      state.isTracking = false;
      state.currentSessionId = null;
      state.sessionStartTime = null;
    },

    trackAction: (state, action: PayloadAction<{
      actionType: UserActionType;
      details?: Partial<UserAction['details']>;
    }>) => {
      if (!state.isTracking) return;
      
      const userAction: UserAction = {
        id: generateActionId(),
        timestamp: Date.now(),
        actionType: action.payload.actionType,
        userName: state.userName,
        details: {
          sessionId: state.currentSessionId || undefined,
          ...action.payload.details,
        }
      };
      
      state.actions.push(userAction);
    },

    trackMessageSent: (state, action: PayloadAction<{
      message: string;
      mode?: string;
    }>) => {
      if (!state.isTracking) return;
      
      const userAction: UserAction = {
        id: generateActionId(),
        timestamp: Date.now(),
        actionType: 'message_sent',
        userName: state.userName,
        details: {
          sessionId: state.currentSessionId || undefined,
          message: action.payload.message,
          messageMode: action.payload.mode,
        }
      };
      
      state.actions.push(userAction);
    },

    trackUICardClicked: (state, action: PayloadAction<{
      cardId: string;
      cardTitle: string;
      actionType: 'ui_card_clicked' | 'ui_card_selected' | 'ui_card_enlarged';
      coordinates?: { x: number; y: number };
      metadata?: Record<string, any>;
    }>) => {
      if (!state.isTracking) return;
      
      const userAction: UserAction = {
        id: generateActionId(),
        timestamp: Date.now(),
        actionType: action.payload.actionType,
        userName: state.userName,
        details: {
          sessionId: state.currentSessionId || undefined,
          cardId: action.payload.cardId,
          cardTitle: action.payload.cardTitle,
          coordinates: action.payload.coordinates,
          metadata: action.payload.metadata,
        }
      };
      
      state.actions.push(userAction);
    },

    trackDrawingAction: (state, action: PayloadAction<{
      actionType: 'drawing_started' | 'drawing_ended' | 'drawing_saved';
      cardId?: string;
      coordinates?: { x: number; y: number };
      drawingData?: string;
      duration?: number;
    }>) => {
      if (!state.isTracking) return;
      
      const userAction: UserAction = {
        id: generateActionId(),
        timestamp: Date.now(),
        actionType: action.payload.actionType,
        userName: state.userName,
        details: {
          sessionId: state.currentSessionId || undefined,
          cardId: action.payload.cardId,
          coordinates: action.payload.coordinates,
          drawingData: action.payload.drawingData,
          duration: action.payload.duration,
        }
      };
      
      state.actions.push(userAction);
    },

    trackIframeElementClicked: (state, action: PayloadAction<{
      elementXPath: string;
      elementTag?: string;
      coordinates?: { x: number; y: number };
    }>) => {
      if (!state.isTracking) return;
      
      const userAction: UserAction = {
        id: generateActionId(),
        timestamp: Date.now(),
        actionType: 'iframe_element_clicked',
        userName: state.userName,
        details: {
          sessionId: state.currentSessionId || undefined,
          elementXPath: action.payload.elementXPath,
          elementTag: action.payload.elementTag,
          coordinates: action.payload.coordinates,
        }
      };
      
      state.actions.push(userAction);
    },

    trackCodeEdited: (state, action: PayloadAction<{
      previousValue: string;
      newValue: string;
    }>) => {
      if (!state.isTracking) return;
      
      const userAction: UserAction = {
        id: generateActionId(),
        timestamp: Date.now(),
        actionType: 'code_edited',
        userName: state.userName,
        details: {
          sessionId: state.currentSessionId || undefined,
          previousValue: action.payload.previousValue,
          newValue: action.payload.newValue,
        }
      };
      
      state.actions.push(userAction);
    },

    trackModeChanged: (state, action: PayloadAction<{
      previousMode: string;
      newMode: string;
    }>) => {
      if (!state.isTracking) return;
      
      const userAction: UserAction = {
        id: generateActionId(),
        timestamp: Date.now(),
        actionType: 'mode_changed',
        userName: state.userName,
        details: {
          sessionId: state.currentSessionId || undefined,
          previousValue: action.payload.previousMode,
          newValue: action.payload.newMode,
        }
      };
      
      state.actions.push(userAction);
    },

    clearActions: (state) => {
      state.actions = [];
    },

    setUserName: (state, action: PayloadAction<string>) => {
      state.userName = action.payload;
    },
  },
});

export const {
  startTracking,
  stopTracking,
  trackAction,
  trackMessageSent,
  trackUICardClicked,
  trackDrawingAction,
  trackIframeElementClicked,
  trackCodeEdited,
  trackModeChanged,
  clearActions,
  setUserName,
} = userTrackingSlice.actions;

export default userTrackingSlice.reducer;
