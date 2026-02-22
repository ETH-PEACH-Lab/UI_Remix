import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GlobalWeb, RetrievedWebData, SpecificWeb } from "../types";
import { defaultApps } from "./defaultData";

interface RetrievalState {
    globalWebs: GlobalWeb[];
    specificWebs: SpecificWeb[];
    retrievedWebData?: RetrievedWebData[]; // Uncomment if you need to keep this
    searchQuery?: string; // Optional search query for filtering
}

const initialState: RetrievalState = {
    globalWebs: [],
    specificWebs: [],
    retrievedWebData: defaultApps, // Initialize as empty array or undefined based on your needs
};

const retrievalSlice = createSlice({
    name: "retrieval",
    initialState,
    reducers: {
        setGlobalWebs(state, action: PayloadAction<GlobalWeb[]>) {
            state.globalWebs = action.payload;
        },
        setSpecificWebs(state, action: PayloadAction<SpecificWeb[]>) {
            state.specificWebs = action.payload;
        },
        setRetrievedWebData(state, action: PayloadAction<RetrievedWebData[]>) {
            state.retrievedWebData = action.payload;
        },
        setDefaultRetrievedWebData(state) {
            state.retrievedWebData = defaultApps; // Reset to default apps
        },
        setSearchQuery(state, action: PayloadAction<string | undefined>) {
            state.searchQuery = action.payload; // Set the search query
        }
    },
});

export const {
    setGlobalWebs,
    setSpecificWebs,
    setRetrievedWebData,
    setSearchQuery,
    setDefaultRetrievedWebData,
} = retrievalSlice.actions;

export default retrievalSlice.reducer;