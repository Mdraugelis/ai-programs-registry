import api from './api';

// Inline types to avoid module resolution issues
type ChatRequest = {
  query: string;
  initiative_ids?: number[];
};

type ChatResponse = {
  response: string;
};

type ChatSetupRequest = {
  api_key: string;
};

type ChatStatusResponse = {
  connected: boolean;
  needs_setup: boolean;
  model?: string;
};

export const chatApi = {
  async getStatus(): Promise<ChatStatusResponse> {
    const response = await api.get('/api/chat/status');
    return response.data;
  },

  async setupApiKey(apiKey: string): Promise<void> {
    const request: ChatSetupRequest = { api_key: apiKey };
    await api.post('/api/chat/setup', request);
  },

  async chat(query: string, initiativeIds?: number[]): Promise<ChatResponse> {
    const request: ChatRequest = { 
      query, 
      initiative_ids: initiativeIds || [] 
    };
    const response = await api.post('/api/chat', request);
    return response.data;
  },

  async disconnect(): Promise<void> {
    await api.delete('/api/chat/disconnect');
  }
};