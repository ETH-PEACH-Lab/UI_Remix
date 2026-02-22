import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_MODEL } from "../config/models";

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface StatusState {
  loading: boolean;
  condition: "baseline" | "experiment";
  mode: "chat" | "retrieve" | "apply";
  showRetrievalPanel: boolean;
  showPreview: boolean;
  selectedModel: string;
  availableModels: Model[];
  loadingType: "searching" | "generating" | "applying" | "thinking" | null; // Add loadingType
}

// Load status settings from localStorage
const loadStatusFromStorage = () => {
  try {
    const savedStatus = localStorage.getItem("app_status");
    if (savedStatus) {
      const parsed = JSON.parse(savedStatus);
      const condition = parsed.condition || "baseline";
      return {
        condition,
        showPreview: parsed.showPreview !== undefined ? parsed.showPreview : true,
        selectedModel: DEFAULT_MODEL,
        showRetrievalPanel: condition === "baseline" ? false : (parsed.showRetrievalPanel || false),
      };
    }
  } catch (error) {
    console.error("Error loading status from localStorage:", error);
  }
  return {
    condition: "baseline" as const,
    showPreview: true,
    selectedModel: DEFAULT_MODEL,
    showRetrievalPanel: false,
  };
};

// Save status settings to localStorage
const saveStatusToStorage = (state: StatusState) => {
  try {
    const statusToSave = {
      condition: state.condition,
      showPreview: state.showPreview,
      showRetrievalPanel: state.showRetrievalPanel,
    };
    localStorage.setItem("app_status", JSON.stringify(statusToSave));
  } catch (error) {
    console.error("Error saving status to localStorage:", error);
  }
};

const savedStatus = loadStatusFromStorage();

const initialState: StatusState = {
  loading: false,
  condition: savedStatus.condition,
  mode: "chat",
  showRetrievalPanel: savedStatus.showRetrievalPanel,
  showPreview: savedStatus.showPreview,
  selectedModel: savedStatus.selectedModel,
  availableModels: [
    // OpenAI Models
    { id: "gpt-5", name: "High Quality Model", provider: "openai" },
    { id: "gpt-4o", name: "Fast Model", provider: "openai" },
  ],
  loadingType: null, // Initialize loadingType
};

const statusSlice = createSlice({
  name: "status",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setLoadingType(state, action: PayloadAction<"searching" | "generating" | "applying" | "thinking" | null>) {
      state.loadingType = action.payload; // Update loadingType
    },
    setCondition(state, action: PayloadAction<"baseline" | "experiment">) {
      state.condition = action.payload;
      if (action.payload === "baseline") {
        state.showRetrievalPanel = false;
      }
      saveStatusToStorage(state);
    },
    setMode(state, action: PayloadAction<"chat" | "retrieve" | "apply">) {
      state.mode = action.payload;
    },
    setShowRetrievalPanel(state, action: PayloadAction<boolean>) {
      if (state.condition === "baseline") {
        state.showRetrievalPanel = false;
      } else {
        state.showRetrievalPanel = action.payload;
      }
      saveStatusToStorage(state);
    },
    setShowPreview(state, action: PayloadAction<boolean>) {
      state.showPreview = action.payload;
      saveStatusToStorage(state);
    },
    setSelectedModel(state, action: PayloadAction<string>) {
      state.selectedModel = action.payload; // Update selectedModel
    }
  },
});

export const {
  setLoading,
  setLoadingType, // Export setLoadingType action
  setCondition,
  setMode,
  setShowRetrievalPanel,
  setShowPreview,
  setSelectedModel,
} = statusSlice.actions;

export default statusSlice.reducer;