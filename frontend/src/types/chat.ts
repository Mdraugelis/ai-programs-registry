// Chat types for AI integration
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type ChatRequest = {
  query: string;
  initiative_ids?: number[];
};

export type ChatResponse = {
  response: string;
};

export type ChatSetupRequest = {
  api_key: string;
};

export type ChatStatusResponse = {
  connected: boolean;
  needs_setup: boolean;
  model?: string;
};

export type ChatState = {
  isOpen: boolean;
  hasApiKey: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
};