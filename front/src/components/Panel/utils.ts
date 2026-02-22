import { MetadataType } from "./types";
import metadata from "../../../metadata.json";
import { GlobalWeb } from "../../types/common";

const typedMetadata = metadata as MetadataType;

export const formatDownloads = (installs: string | number): string => {
  if (typeof installs === 'string') {
    if (installs.includes('M') || installs.includes('K') || installs.includes('+')) {
      return installs;
    }
    const num = parseInt(installs.replace(/[,\s]/g, ''));
    if (isNaN(num)) return installs;
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M+`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    }
    return num.toString();
  }
  
  if (typeof installs === 'number') {
    if (installs >= 1000000) {
      return `${(installs / 1000000).toFixed(1)}M+`;
    } else if (installs >= 1000) {
      return `${(installs / 1000).toFixed(1)}K+`;
    }
    return installs.toString();
  }
  
  return String(installs);
};

export const getWebpageTitle = (webpageId: number | null | undefined, retrievedWebData?: any[], globalWebs?: GlobalWeb[]): string => {
  if (webpageId === null || webpageId === undefined) return "";
  
  if (retrievedWebData) {
    const webpage = retrievedWebData.find(data => data.id === webpageId);
    if (webpage) {
      return webpage.metadata.title;
    }
  }
  
  if (globalWebs) {
    const globalWeb = globalWebs.find(web => web.id === webpageId);
    if (globalWeb) {
      const appMetadata = typedMetadata[String(webpageId)];
      return appMetadata?.title || `App ${webpageId}`;
    }
  }
  
  const appMetadata = typedMetadata[String(webpageId)];
  return appMetadata?.title || `App ${webpageId}`;
};
