import type { Model } from '../types/common';

export const availableModels: Model[] = [
  // OpenAI Models
  { id: "gpt-5", name: "High Quality Model", provider: "openai" },
  { id: "gpt-4o", name: "Fast Model", provider: "openai" },
];

export const DEFAULT_MODEL = "gpt-5";

export const getModelsByProvider = (provider: 'openai' | 'anthropic') => {
  return availableModels.filter(model => model.provider === provider);
};

export const getModelById = (id: string) => {
  return availableModels.find(model => model.id === id);
}; 