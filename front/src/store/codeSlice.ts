import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { saveCodeToHistory } from "./codeHistorySlice";

// Load code from localStorage
const loadCodeFromStorage = (): string => {
  try {
    const savedCode = localStorage.getItem("current_code");
    return savedCode || "// Loading code...";
  } catch (error) {
    console.error("Error loading code from localStorage:", error);
    return "// Loading code...";
  }
};

// Save code to localStorage
const saveCodeToStorage = (code: string) => {
  try {
    localStorage.setItem("current_code", code);
  } catch (error) {
    console.error("Error saving code to localStorage:", error);
  }
};

interface CodeState {
  code: string;
}

const initialState: CodeState = {
  code: loadCodeFromStorage(), // Load from localStorage or use default
};

// Async thunk to fetch initial code content
export const fetchCodeContent = createAsyncThunk(
  "code/fetchCodeContent",
  async (url: string, { rejectWithValue }) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      return text; // Return the fetched code content
    } catch (error) {
      console.error("Getting code failed", error);
      return rejectWithValue("// Getting code fail, please try again");
    }
  }
);

// Async thunk to set code and save to history
export const setCodeFromServer = createAsyncThunk(
  "code/setCodeFromServer",
  async (payload: { code: string; messageId?: number }, { dispatch }) => {
    const { code, messageId } = payload;
    
    // First update the code
    dispatch(setCode(code));
    
    // Then save to history if the code is valid
    if (code && code.trim() !== "" && code !== "// Loading code...") {
      dispatch(saveCodeToHistory({ code, messageId }));
    }
    
    return code;
  }
);

const codeSlice = createSlice({
  name: "code",
  initialState,
  reducers: {
    setCode(state, action: PayloadAction<string>) {
      state.code = action.payload; // Update the code state
      saveCodeToStorage(state.code);
    },
    clearCode(state) {
      state.code = ""; // Clear the code state
      saveCodeToStorage(state.code);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCodeContent.fulfilled, (state, action) => {
      state.code = action.payload; // Set code when fetch succeeds
      saveCodeToStorage(state.code);
    });
    builder.addCase(fetchCodeContent.rejected, (state, action) => {
      state.code = action.payload as string; // Set fallback code on failure
      saveCodeToStorage(state.code);
    });
  },
});

export const { setCode, clearCode } = codeSlice.actions;

export default codeSlice.reducer;