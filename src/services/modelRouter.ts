/**
 * Model Routing Service
 * Abstracts the AI model selection and configuration.
 * This allows switching between different AI providers/models without changing the codebase.
 */

export interface ModelConfig {
  provider: string;
  name: string;
  version: string;
}

// Get the current AI model configuration
// The actual model name is determined at runtime and not exposed directly in the code
export const getModelConfig = (): ModelConfig => {
  const modelName = import.meta.env.VITE_AI_MODEL || 'flash-lite-advanced';
  
  return {
    provider: import.meta.env.VITE_AI_PROVIDER || 'advanced-ai',
    name: modelName,
    version: '2.5',
  };
};

// Get model identifier for API calls
export const getModelIdentifier = (): string => {
  return "gemini-2.5-flash-lite";
};

// Get reward token from environment
export const getReward = (): string => {
  return import.meta.env.VITE_AI_REWARD || '';
};

// Check if model is available
export const isModelAvailable = (): boolean => {
  return !!getReward();
};
