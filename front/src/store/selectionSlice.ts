import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RetrievedWebData } from "../types"; // Import WebpageData from ./types

interface SelectionState {
  selectedTag: string | null;
  selectedExample: RetrievedWebData | null; // Use WebpageData type for selectedExample
  isSpecific: boolean; // Move isSpecific here
}

const initialState: SelectionState = {
  selectedTag: null, // Default value
  selectedExample: null, // Default value for selectedExample
  isSpecific: false, // Default value for isSpecific
};

const selectionSlice = createSlice({
  name: "selection",
  initialState,
  reducers: {
    setSelectedTag(state, action: PayloadAction<string | null>) {
      state.selectedTag = action.payload;
    },
    setSelectedExample(state, action: PayloadAction<RetrievedWebData | null>) {
      state.selectedExample = action.payload; // Add reducer for selectedExample
    },
    resetSelectedExample(state) {
      state.selectedExample = null; // Add a reset action for selectedExample
    },
    setIsSpecific(state, action: PayloadAction<boolean>) {
      state.isSpecific = action.payload; // Add reducer for isSpecific
    },
  },
});

export const { setSelectedTag, setSelectedExample, resetSelectedExample, setIsSpecific } = selectionSlice.actions;
export default selectionSlice.reducer;