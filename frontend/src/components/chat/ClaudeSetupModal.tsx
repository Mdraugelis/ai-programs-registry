import React, { useState } from 'react';
import {
  Modal,
  Title,
  Text,
  Stack,
  TextInput,
  Button,
  Group,
  Anchor,
  List,
  Alert,
  Loader,
} from '@mantine/core';
import { IconExternalLink, IconAlertCircle, IconRobot } from '@tabler/icons-react';

interface ClaudeSetupModalProps {
  opened: boolean;
  onClose: () => void;
  onSetup: (apiKey: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
}

const ClaudeSetupModal: React.FC<ClaudeSetupModalProps> = ({
  opened,
  onClose,
  onSetup,
  isLoading = false,
  error = null,
}) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    const success = await onSetup(apiKey.trim());
    if (success) {
      setApiKey('');
      onClose();
    }
  };

  const handleClose = () => {
    setApiKey('');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconRobot size={24} />
          <Title order={3}>Connect Your Claude Account</Title>
        </Group>
      }
      size="md"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            To use AI chat, you'll need a Claude API key from Anthropic. This enables
            conversational exploration of your AI initiatives data.
          </Text>

          <Stack gap="xs">
            <Text size="sm" fw={500}>
              How to get your Claude API key:
            </Text>
            <List size="sm" spacing="xs">
              <List.Item>
                Visit{' '}
                <Anchor
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                >
                  console.anthropic.com
                  <IconExternalLink size={14} style={{ marginLeft: 4 }} />
                </Anchor>
              </List.Item>
              <List.Item>Sign up or log in to your Anthropic account</List.Item>
              <List.Item>Navigate to the "API Keys" section</List.Item>
              <List.Item>Create a new API key</List.Item>
              <List.Item>Copy and paste it below</List.Item>
            </List>
          </Stack>

          <TextInput
            label="Claude API Key"
            placeholder="sk-ant-api03-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.currentTarget.value)}
            type="password"
            required
            disabled={isLoading}
          />

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          <Group justify="space-between">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!apiKey.trim() || isLoading}
              leftSection={isLoading ? <Loader size={16} /> : null}
            >
              {isLoading ? 'Connecting...' : 'Save & Connect'}
            </Button>
          </Group>

          <Alert variant="light" color="blue">
            <Text size="xs">
              <strong>Privacy Note:</strong> Your API key is encrypted and stored locally.
              It's never shared with other users. You control your own usage and costs.
            </Text>
          </Alert>
        </Stack>
      </form>
    </Modal>
  );
};

export default ClaudeSetupModal;