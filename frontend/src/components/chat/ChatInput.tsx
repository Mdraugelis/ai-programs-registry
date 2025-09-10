import React, { useState, useRef, useEffect } from 'react';
import { TextInput, ActionIcon, Group, Loader } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  isLoading = false,
  placeholder = "Ask about your AI initiatives...",
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group gap="xs" align="flex-end">
        <TextInput
          ref={inputRef}
          flex={1}
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          autoComplete="off"
          style={{ flex: 1 }}
        />
        <ActionIcon
          type="submit"
          variant="filled"
          size="lg"
          disabled={!message.trim() || isLoading || disabled}
          loading={isLoading}
        >
          {isLoading ? <Loader size={16} /> : <IconSend size={16} />}
        </ActionIcon>
      </Group>
    </form>
  );
};

export default ChatInput;