import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DrawingCacheItem {
  appId: string;
  drawingUrl: string;
  timestamp: number;
  fileName: string;
}

interface DrawingCacheState {
  cache: Record<string, DrawingCacheItem>; // appId -> DrawingCacheItem
}

const initialState: DrawingCacheState = {
  cache: {},
};

export const drawingCacheSlice = createSlice({
  name: 'drawingCache',
  initialState,
  reducers: {
    saveDrawingToCache: (state, action: PayloadAction<{ appId: string; drawingBlob: Blob }>) => {
      const { appId, drawingBlob } = action.payload;
      const timestamp = Date.now();
      const fileName = `drawing_${appId}_${timestamp}.png`;
      
      if (state.cache[appId]?.drawingUrl) {
        URL.revokeObjectURL(state.cache[appId].drawingUrl);
      }
      
      const drawingUrl = URL.createObjectURL(drawingBlob);
      
      state.cache[appId] = {
        appId,
        drawingUrl,
        timestamp,
        fileName,
      };
    },
    removeDrawingFromCache: (state, action: PayloadAction<string>) => {
      const appId = action.payload;
      if (state.cache[appId]?.drawingUrl) {
        URL.revokeObjectURL(state.cache[appId].drawingUrl);
      }
      delete state.cache[appId];
    },
    clearDrawingCache: (state) => {
      Object.values(state.cache).forEach(item => {
        if (item.drawingUrl) {
          URL.revokeObjectURL(item.drawingUrl);
        }
      });
      state.cache = {};
    },
  },
});

export const { saveDrawingToCache, removeDrawingFromCache, clearDrawingCache } = drawingCacheSlice.actions;

export const getBlobFromCache = async (drawingUrl: string): Promise<Blob> => {
  const response = await fetch(drawingUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch blob from cache URL');
  }
  return await response.blob();
};

export default drawingCacheSlice.reducer;
