export interface APIEndpoints {
  CHAT: string;
  GENERATE: string;
  GLOBAL_RETRIEVE: string;
  SPECIFIC_RETRIEVE: string;
  BASELINE: string;
  LOGIN: string;
  TRACK_APPEND_ACTION: string;
}



export interface ChatResponse {
  newChatHistory: any[];
  code: string;
  retrievalQuery: string;
  globalWebs: any[];
  specificWebs: any[];
}

export interface GlobalRetrievalResponse {
  retrievalResult: string[];
}

export interface SpecificRetrievalResponse {
  retrievalResult: string[];
  retrievalBox: number[][][];
}

export interface BaselineResponse {
  newChatHistory: any[];
  code: string;
}

export interface ErrorResponse {
  detail: string;
} 