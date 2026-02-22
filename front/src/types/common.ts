export interface Model {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic';
}

export interface GlobalWeb {
  id: number;
  requirements: string;
}

export interface SpecificWeb {
  id: number;
  part: string;
  requirements: string;
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

export interface AppMetadataItem extends PreAppMetadata {
  [key: string]: any;
}
export interface MetadataType {
  [key: string]: AppMetadataItem;
}
export type LocationState = {
  from: string;
}; 

export interface RetrievedWebData {
  id: number;
  title: string;
  thumbnail: string;
  box?: number[][];
  metadata: PreAppMetadata;
  type: "app";
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

export type InputMode = 'chat' | 'retrieve' | 'apply';

export interface SystMessage extends Message {
  sender: "assistant";
  type: "message";
}
