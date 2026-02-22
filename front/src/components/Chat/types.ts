import { PreAppMetadata } from "../../types/common";

export type InputMode = 'chat' | 'retrieve' | 'apply';

export interface ChatProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  setGloQuery: (query: string) => void;
}


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

export interface Message {
  messageId: number;
  sender: "user" | "assistant";
  content: string;
  type: "message" | "file" | "web_image";
  mode?: "chat" | "retrieve" | "apply";
  file?: File;
  style?: string;
  example?: {
    id: number;
    title: string;
    metadata: PreAppMetadata;
  } | null
  tag?: string | null;
}

export interface UserMessage extends Message {
  sender: "user";
  type: "message" | "file";
  file?: File;
}

export interface SystMessage extends Message {
  sender: "assistant";
  type: "message";
}

export interface Model {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic';
}