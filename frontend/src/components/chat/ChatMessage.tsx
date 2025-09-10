import React from 'react';
import { Paper, Text, Group, Avatar, Stack } from '@mantine/core';
import { IconUser, IconRobot } from '@tabler/icons-react';

// Inline type to avoid module resolution issues
type ChatMessageType = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <Group
      align="flex-start"
      gap="sm"
      style={{ 
        flexDirection: isUser ? 'row-reverse' : 'row',
        marginBottom: 16 
      }}
    >
      <Avatar
        color={isUser ? 'blue' : 'green'}
        size={32}
        radius="xl"
      >
        {isUser ? <IconUser size={18} /> : <IconRobot size={18} />}
      </Avatar>
      
      <Stack gap={4} style={{ flex: 1, maxWidth: '80%' }}>
        <Paper
          p="sm"
          bg={isUser ? 'blue.0' : 'gray.0'}
          style={{
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
          }}
        >
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </Text>
        </Paper>
        
        <Text size="xs" c="dimmed" ta={isUser ? 'right' : 'left'}>
          {message.timestamp.toLocaleTimeString()}
        </Text>
      </Stack>
    </Group>
  );
};

export default ChatMessage;