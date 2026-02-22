import { configureStore } from "@reduxjs/toolkit";
import messageReducer from "./messagesSlice";
import statusReducer from "./statusSlice";
import selectionReducer from "./selectionSlice"; // Import selectionSlice
import codeReducer from "./codeSlice"; // Import codeSlice
import retrievalReducer from "./retrievalSlice"; // Import retrievalSlice
import drawingCacheReducer from "./drawingCacheSlice"; // Import drawingCacheSlice
import codeHistoryReducer from "./codeHistorySlice"; // Import codeHistorySlice
import userTrackingReducer from "./userTrackingSlice"; // Import userTrackingSlice
import { trackingMiddleware } from "./trackingMiddleware";

const store = configureStore({
  reducer: {
    messages: messageReducer,
    status: statusReducer,
    selection: selectionReducer, // Add selectionReducer
    code: codeReducer, // Add codeReducer
    retrieval: retrievalReducer, // Add retrievalReducer
    drawingCache: drawingCacheReducer, // Add drawingCacheReducer
    codeHistory: codeHistoryReducer, // Add codeHistoryReducer
    userTracking: userTrackingReducer, // Add userTrackingReducer
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(trackingMiddleware),
});

export { store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;