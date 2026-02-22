import { Message } from "../../types";

export interface AppMetadataItem {
  title: string;
  installs: string;
  score: string;
  reviews: string;
  price: number;
  genre: string;
  developer: string;
  app_id: string;
  [key: string]: any;
}

export interface MetadataType {
 [key: string]: AppMetadataItem;
}

export interface WebpageData {
  id: number;
  title: string;
  thumbnail: string;
  box?: number[][];
  metadata: PreAppMetadata;
  type: "app";
}

export interface BasePanelProps {
  messages: Message[];
  getBlobUrl: (data: string | Blob) => string;
  onClose?: () => void;
}

export interface PreAppMetadata {
  title: string;
  installs: string;
  score: string;
  reviews: string;
  price: number;
  genre: string;
  developer: string;
  icon?: string;
}

export interface EnlargedImage {
  url: string;
  title: string;
  metadata: PreAppMetadata;
  fallbackUrl?: string;
}
