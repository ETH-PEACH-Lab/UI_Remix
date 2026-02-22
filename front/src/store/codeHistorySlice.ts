import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CodeHistoryItem {
  code: string;
  timestamp: number;
  messageId?: number;
}

interface CodeHistoryState {
  history: CodeHistoryItem[];
  currentIndex: number;
}

const initialState: CodeHistoryState = {
  history: [],
  currentIndex: 0,
};

const codeHistorySlice = createSlice({
  name: "codeHistory",
  initialState,
  reducers: {
    saveCodeToHistory(state, action: PayloadAction<{ code: string; messageId?: number }>) {
      const { code, messageId } = action.payload;
      
      if (state.currentIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.currentIndex + 1);
      }
      
      const newHistoryItem: CodeHistoryItem = {
        code,
        timestamp: Date.now(),
        messageId,
      };
      
      state.history.push(newHistoryItem);
      
      state.currentIndex = state.history.length - 1;
      
      if (state.history.length > 50) {
        const removeCount = state.history.length - 50;
        state.history = state.history.slice(removeCount);
        state.currentIndex -= removeCount;
        if (state.currentIndex < 0) state.currentIndex = 0;
      }
    },
    
    undoCode(state) {
      if (state.currentIndex > 0) {
        state.currentIndex--;
      }
    },
    
    redoCode(state) {
      if (state.currentIndex < state.history.length - 1) {
        state.currentIndex++;
      }
    },
    
    clearHistory(state) {
      state.history = [];
      state.currentIndex = 0;
    },
    
    initializeHistory(state, action: PayloadAction<string>) {
      const initialCode = action.payload;
      if (state.history.length === 0) {
        state.history.push({
          code: initialCode,
          timestamp: Date.now(),
        });
        state.currentIndex = 0;
      }
    },
  },
});

export const {
  saveCodeToHistory,
  undoCode,
  redoCode,
  clearHistory,
  initializeHistory,
} = codeHistorySlice.actions;

export default codeHistorySlice.reducer;
