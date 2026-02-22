// API configuration imports
import { API_ENDPOINTS } from "../config/api";

// Type imports
import { GlobalWeb, Message, SpecificWeb } from "../types";
import { MetadataType } from "../components/Chat/types";
import { BaselineResponse } from "../types/api";

// Redux imports
import { setMessages } from "../store/messagesSlice";
import { setLoading, setLoadingType } from "../store/statusSlice";
import { getBlobFromCache } from "../store/drawingCacheSlice";
import { RootState } from "../store";

// UI library imports
import { message } from "antd";
import { Dispatch } from "@reduxjs/toolkit";

async function getOriginalImageBlob(imageId: string): Promise<Blob> {
  const response = await fetch(`/data/${imageId}/${imageId}.png`);
  if (!response.ok) {
    throw new Error(`Failed to fetch original image: ${response.status}`);
  }
  return await response.blob();
}

async function mergeDrawingWithOriginalImage(imageId: string, drawingBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const originalImg = new Image();
    originalImg.crossOrigin = 'anonymous';
    
    const drawingImg = new Image();
    const drawingUrl = URL.createObjectURL(drawingBlob);
    
    originalImg.onload = () => {
      drawingImg.onload = () => {
        try {
          const mergeCanvas = document.createElement('canvas');
          const mergeCtx = mergeCanvas.getContext('2d');
          if (!mergeCtx) {
            throw new Error('Cannot get canvas context');
          }

          mergeCanvas.width = originalImg.naturalWidth;
          mergeCanvas.height = originalImg.naturalHeight;

          mergeCtx.drawImage(originalImg, 0, 0);

          // Draw the user layer scaled to the original image size.
          mergeCtx.drawImage(drawingImg, 0, 0, mergeCanvas.width, mergeCanvas.height);

          mergeCanvas.toBlob((mergedBlob) => {
            URL.revokeObjectURL(drawingUrl);
            if (mergedBlob) {
              resolve(mergedBlob);
            } else {
              reject(new Error('Failed to create merged blob'));
            }
          }, 'image/png');
        } catch (error) {
          URL.revokeObjectURL(drawingUrl);
          reject(error);
        }
      };
      
      drawingImg.onerror = () => {
        URL.revokeObjectURL(drawingUrl);
        reject(new Error('Failed to load drawing image'));
      };
      
      drawingImg.src = drawingUrl;
    };
    
    originalImg.onerror = () => {
      URL.revokeObjectURL(drawingUrl);
      reject(new Error('Failed to load original image'));
    };
    
    originalImg.src = `/data/${imageId}/${imageId}.png`;
  });
}

interface ChatRequestParams {
  chatHistory: Message[];
  code: string;
  model: string;
  globalWebs: GlobalWeb[];
  specificWebs: SpecificWeb[];
  fileMessages: Message[]; // Only file-type messages
  selectedTag?: string | null; // Selected tag from the UI (optional).
  drawingBlob?: Blob | null; // Optional image payload (e.g., drawing layer).
}

export async function sendChatRequest(params: ChatRequestParams) {
  const formData = new FormData();
  formData.append("chatHistory", JSON.stringify(params.chatHistory));
  formData.append("code", params.code);
  formData.append("model", params.model);
  formData.append("globalWebs", JSON.stringify(params.globalWebs));
  formData.append("specificWebs", JSON.stringify(params.specificWebs));
  
  if (params.selectedTag) {
    formData.append("selectedTag", params.selectedTag);
  }

  const fileInfos: { index: number; name: string; type: string }[] = [];
  params.fileMessages.forEach((msg) => {
    const fileId = `file_${msg.messageId}`;
    if (msg.file) {
      formData.append(fileId, msg.file, msg.file.name);
      fileInfos.push({
        index: msg.messageId,
        name: msg.file.name,
        type: msg.file.type,
      });
    }
  });
  formData.append("fileInfos", JSON.stringify(fileInfos));

  const response = await fetch(API_ENDPOINTS.CHAT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: Request failed`);
  }

  const data = await response.json();
  return {
    newChatHistory: data.newChatHistory,
    code: data.code,
    retrievalQuery: data.retrievalQuery,
    globalWebs: data.globalWebs,
    specificWebs: data.specificWebs,
  };
}

export async function sendApplyRequest(params: ChatRequestParams) {
  const formData = new FormData();
  formData.append("chatHistory", JSON.stringify(params.chatHistory));
  formData.append("code", params.code);
  formData.append("model", params.model);
  formData.append("globalWebs", JSON.stringify(params.globalWebs));
  formData.append("specificWebs", JSON.stringify(params.specificWebs));
  formData.append("fileInfos", JSON.stringify(params.fileMessages));
  
  // Pass the target tag (defaults to "global").
  var targetTag: string = "global";
  if (params.selectedTag) {
    targetTag = params.selectedTag;
  } 
  formData.append("targetTag", targetTag);

  // Attach drawing image payload if provided.
  if (params.drawingBlob) {
    formData.append("drawingImage", params.drawingBlob, "drawing.png");
  }

  const response = await fetch(API_ENDPOINTS.GENERATE, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: Request failed`);
  }

  return await response.json();
}

export async function sendBaselineRequest(params: ChatRequestParams): Promise<BaselineResponse> {
  const formData = new FormData();
  formData.append("chatHistory", JSON.stringify(params.chatHistory));
  formData.append("code", params.code);
  formData.append("model", params.model);
  
  const response = await fetch(API_ENDPOINTS.BASELINE, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: Request failed`);
  }

  return await response.json();
}

export function formatErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown error";

  let msg = error.message;
  msg = "Failed to send message. Please try again.";
  if (msg.includes("API key")) return "API key error. Please check your API key configuration.";
  if (msg.includes("400")) return "Request error. Please check your input and try again.";
  if (msg.includes("401") || msg.includes("403")) return "Authentication error. Please verify your API keys.";
  if (msg.includes("429")) return "Rate limit exceeded. Please wait a moment and try again.";
  if (msg.includes("500")) return "Server error. Please try again later.";
  return msg;
}

interface ModeHandlerParams {
  newMessages: Message[];
  requestFn: (params: ChatRequestParams) => Promise<any>;
  onSuccess: (result: any) => void;
  errorPrefix: string;
  dispatch: Dispatch;
  getState: () => RootState;
  selectedTag?: string | null; // Optional selected tag.
  selectedExampleId?: string | null; // Optional selected example ID.
}

export async function handleModeRequest({
  newMessages,
  requestFn,
  onSuccess,
  errorPrefix,
  dispatch,
  getState,
  selectedTag: passedSelectedTag,
  selectedExampleId,
}: ModeHandlerParams) {
  try {
    const state = getState();
    const code = state.code.code;
    const model = state.status.selectedModel;
    const globalWebs = state.retrieval.globalWebs;
    const specificWebs = state.retrieval.specificWebs;
    // Prefer the passed selectedTag; fall back to store if undefined.
    const selectedTag = passedSelectedTag !== undefined ? passedSelectedTag : state.selection.selectedTag;
    
    // Prepare image data (used in apply mode when an example is selected).
    let drawingBlob: Blob | null = null;
    if (selectedExampleId) {
      if (state.drawingCache.cache[selectedExampleId]) {
        // If a drawing cache exists, merge the user layer with the original image.
        const cachedDrawing = state.drawingCache.cache[selectedExampleId];
        
        try {
          // Fetch the cached drawing layer blob, then merge with the original.
          const drawingBlob_temp = await getBlobFromCache(cachedDrawing.drawingUrl);
          const mergedBlob = await mergeDrawingWithOriginalImage(
            selectedExampleId, 
            drawingBlob_temp
          );
          drawingBlob = mergedBlob;
        } catch (error) {
          console.error('Failed to merge drawing with original image:', error);
          // If merging fails, fall back to sending the cached layer blob directly.
          try {
            drawingBlob = await getBlobFromCache(cachedDrawing.drawingUrl);
          } catch (urlError) {
            console.error('Failed to get blob from cache URL:', urlError);
          }
        }
      } else {
        // No drawing cache; send the original image.
        console.log('No drawing cache; sending original image:', selectedExampleId);
        try {
          const originalImageBlob = await getOriginalImageBlob(selectedExampleId);
          drawingBlob = originalImageBlob;
          console.log('Fetched original image, size:', originalImageBlob.size, 'bytes');
        } catch (error) {
          console.error('Failed to get original image:', error);
        }
      }
    }
    
    const fileMessages = newMessages.filter(msg => msg.type === "file");

    const result = await requestFn({
      chatHistory: newMessages,
      code: code || "",
      model: model || "",
      globalWebs: globalWebs || [],
      specificWebs: specificWebs || [],
      fileMessages: fileMessages || [],
      selectedTag: selectedTag || "global",
      drawingBlob,
    });

    onSuccess(result);
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    message.error(errorMessage);

    const errorChatMessage: Message = {
      messageId: newMessages.length + 1,
      sender: "assistant",
      content: `${errorPrefix} Error: ${errorMessage}`,
      type: "message",
      mode: "chat",
    };
    dispatch(setMessages([...newMessages, errorChatMessage]));
  } finally {
    dispatch(setLoadingType(null));
    dispatch(setLoading(false));
  }
}

export const globalSearch = async (
  retrievalInput: string,
  reference: GlobalWeb[]
): Promise<string[]> => {
  const cleanedInput = retrievalInput.trim();

  const formData = new FormData();
  formData.append("retrieveInput", cleanedInput);
  formData.append("globalWebs", JSON.stringify(reference));

  try {
    const response = await fetch(API_ENDPOINTS.GLOBAL_RETRIEVE, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Global retrieve failed (HTTP ${response.status})`
      );
    }

    const response_data = await response.json();
    return response_data.retrievalResult;
  } catch (err) {
    console.error("❌ globalSearch failed:", err);
    throw err;
  }
}

export const localSearch = async (
  retrievalInput: string,
  selectedTag: string
): Promise<[string[], number[][][]]> => {
  try {
    const cleanedInput = retrievalInput.trim();

    const formData = new FormData();
    formData.append("retrieveInput", cleanedInput);
    formData.append("selectedTag", selectedTag);

    const response = await fetch(API_ENDPOINTS.SPECIFIC_RETRIEVE, {
      method: "POST",
      body: formData,
    });

    const response_data = await response.json();
    const retrievedWebs = response_data.retrievalResult;
    const retrievedBoxes = response_data.retrievalBox;

    return [retrievedWebs, retrievedBoxes];
  } catch (error) {
    console.error("❌ localSearch failed:", error);
    throw error;
  }
}

export function formatRetrievedWebData(
  webIds: string[],
  metadata: MetadataType,
  options?: { boxes?: number[][][] }
) {
  return webIds.map((webIdStr, index) => {
    const webId = Number(webIdStr);
    const meta = metadata[webIdStr];
    // Use app_id if present; otherwise fall back to the webIdStr.
    const appId = meta?.app_id || webIdStr;

    return {
      id: webId,
      title: meta?.title || `App ${webIdStr}`,
      thumbnail: `/data/${webIdStr}/${webIdStr}.png`,
      box: options?.boxes?.[index],
      metadata: {
        title: meta?.title || `App ${webIdStr}`,
        installs: meta?.installs || "0",
        score: meta?.score || "0",
        reviews: meta?.reviews || "0",
        price: meta?.price || 0,
        genre: meta?.genre || "Unknown",
        developer: meta?.developer || "Unknown",
        icon: `./icons/${appId}.png`, // Build icon path from app_id.
      },
      type: "app" as const,
    };
  });
}
