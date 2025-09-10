import React, { useEffect, useRef } from 'react';
import {
  Paper,
  Title,
  Text,
  Stack,
  Group,
  ActionIcon,
  Button,
  Divider,
} from '@mantine/core';
import { 
  IconX, 
  IconSettings, 
  IconMessageCircle, 
  IconRobot,
  IconTrash 
} from '@tabler/icons-react';
import { useAIChat } from '../../hooks/useAIChat';
import ClaudeSetupModal from './ClaudeSetupModal';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initiativeIds?: number[];
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isOpen,
  onClose,
  initiativeIds = [],
}) => {
  const {
    hasApiKey,
    messages,
    isLoading,
    error,
    setupApiKey,
    sendMessage,
    disconnectApiKey,
    clearMessages,
  } = useAIChat();

  const [showSetup, setShowSetup] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Show setup modal if no API key when panel opens
  useEffect(() => {
    if (isOpen && !hasApiKey) {
      setShowSetup(true);
    }
  }, [isOpen, hasApiKey]);

  const handleSendMessage = (message: string) => {
    sendMessage(message, initiativeIds);
  };

  const handleSetup = async (apiKey: string) => {
    const success = await setupApiKey(apiKey);
    if (success) {
      setShowSetup(false);
    }
    return success;
  };

  const handleDisconnect = async () => {
    await disconnectApiKey();
    setShowSettings(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 60,
          right: 0,
          width: '30%',
          height: 'calc(100vh - 60px)',
          zIndex: 1000,
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr auto',
          backgroundColor: 'white',
          borderLeft: '1px solid #e0e0e0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <Group p="md" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
          <Group gap="xs">
            <IconRobot size={20} color="var(--mantine-color-blue-6)" />
            <Title order={4}>AI Assistant</Title>
          </Group>
          <Group gap="xs">
            {hasApiKey && (
              <>
                <ActionIcon
                  variant="subtle"
                  onClick={() => setShowSettings(!showSettings)}
                  title="Settings"
                >
                  <IconSettings size={16} />
                </ActionIcon>
                {messages.length > 0 && (
                  <ActionIcon
                    variant="subtle"
                    onClick={clearMessages}
                    title="Clear messages"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                )}
              </>
            )}
            <ActionIcon
              variant="subtle"
              onClick={onClose}
              title="Close chat"
            >
              <IconX size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Settings Panel */}
        {showSettings && hasApiKey && (
          <Paper p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
            <Stack gap="sm">
              <Text size="sm" fw={500}>Chat Settings</Text>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">API Status</Text>
                <Text size="xs" c="green">● Connected</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Model</Text>
                <Text size="xs">Claude 3 Sonnet</Text>
              </Group>
              <Divider />
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={handleDisconnect}
              >
                Disconnect Claude
              </Button>
            </Stack>
          </Paper>
        )}

        {/* API Key Setup Area */}
        {!hasApiKey ? (
          <div style={{ 
            gridRow: '3 / 4',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem'
          }}>
            <Stack align="center" gap="md">
              <IconMessageCircle size={48} color="var(--mantine-color-dimmed)" />
              <div style={{ textAlign: 'center' }}>
                <Text size="lg" fw={500} mb={4}>
                  AI Chat Setup Required
                </Text>
                <Text size="sm" c="dimmed" mb="md">
                  Connect your Claude API key to start chatting about your AI initiatives
                </Text>
              </div>
              <Button
                onClick={() => setShowSetup(true)}
                leftSection={<IconRobot size={16} />}
              >
                Setup Claude API
              </Button>
            </Stack>
          </div>
        ) : (
          <>
            {/* Messages Area - Uses grid row 3 (1fr = takes all available space) */}
            <div
              style={{
                gridRow: '3 / 4',
                overflowY: 'auto',
                padding: '1rem',
                minHeight: 0,
              }}
            >
              {messages.length === 0 ? (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <IconMessageCircle size={32} color="var(--mantine-color-dimmed)" />
                    <Text size="sm" c="dimmed" mt="sm">
                      Start a conversation about your AI initiatives.
                      {initiativeIds.length > 0 && (
                        <><br />Currently viewing {initiativeIds.length} initiative{initiativeIds.length !== 1 ? 's' : ''}.</>
                      )}
                    </Text>
                  </div>
                </div>
              ) : (
                <div>
                  {messages.map((message) => (
                    <div key={message.id} style={{ marginBottom: '1rem' }}>
                      <ChatMessage message={message} />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area - Uses grid row 4 (auto = size to content) */}
            <div style={{ 
              gridRow: '4 / 5',
              padding: '1rem', 
              borderTop: '1px solid var(--mantine-color-gray-2)',
            }}>
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={!hasApiKey}
                isLoading={isLoading}
                placeholder={
                  initiativeIds.length > 0 
                    ? `Ask about these ${initiativeIds.length} initiatives...`
                    : "Ask about your AI initiatives..."
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Setup Modal */}
      <ClaudeSetupModal
        opened={showSetup}
        onClose={() => setShowSetup(false)}
        onSetup={handleSetup}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

export default AIChatPanel;