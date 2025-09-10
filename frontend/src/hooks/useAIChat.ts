import { useState, useEffect } from 'react';
import { chatApi } from '../services/chatApi';
import { notifications } from '@mantine/notifications';
import { v4 as uuidv4 } from 'uuid';

// Inline types to avoid module resolution issues
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type ChatState = {
  isOpen: boolean;
  hasApiKey: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
};

export const useAIChat = () => {
  const [state, setState] = useState<ChatState>({
    isOpen: false,
    hasApiKey: false,
    messages: [],
    isLoading: false,
    error: null,
  });

  // Check API key status on mount
  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const status = await chatApi.getStatus();
      setState(prev => ({
        ...prev,
        hasApiKey: status.connected,
      }));
    } catch (error) {
      console.error('Failed to check API key status:', error);
    }
  };

  const toggleChat = () => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const setupApiKey = async (apiKey: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await chatApi.setupApiKey(apiKey);
      
      setState(prev => ({ 
        ...prev, 
        hasApiKey: true,
        isLoading: false 
      }));

      notifications.show({
        title: 'Success',
        message: 'Claude API key connected successfully!',
        color: 'green',
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to setup API key';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });

      return false;
    }
  };

  const sendMessage = async (query: string, initiativeIds?: number[]) => {
    if (!query.trim() || !state.hasApiKey) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await chatApi.chat(query, initiativeIds);
      
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to process chat message';
      
      if (error.response?.status === 403) {
        // API key issue - reset key status
        errorMessage = error.response.data?.detail || 'API key issue. Please reconfigure your Claude API key.';
        setState(prev => ({ ...prev, hasApiKey: false }));
      } else {
        errorMessage = error.response?.data?.detail || errorMessage;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      notifications.show({
        title: 'Chat Error',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  const disconnectApiKey = async () => {
    try {
      await chatApi.disconnect();
      setState(prev => ({
        ...prev,
        hasApiKey: false,
        messages: [],
      }));

      notifications.show({
        title: 'Disconnected',
        message: 'Claude API key removed successfully',
        color: 'blue',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: 'Failed to disconnect API key',
        color: 'red',
      });
    }
  };

  const clearMessages = () => {
    setState(prev => ({ ...prev, messages: [] }));
  };

  const closeChat = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    ...state,
    toggleChat,
    setupApiKey,
    sendMessage,
    disconnectApiKey,
    clearMessages,
    closeChat,
    checkApiKeyStatus,
  };
};