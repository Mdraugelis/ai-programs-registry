import React, { useState } from 'react';
import { 
  Container, Paper, Stack, TextInput, PasswordInput, 
  Button, Alert, Title, Text, Center, ThemeIcon, 
  Divider, Code, Group
} from '@mantine/core';
import { IconAlertCircle, IconBrain } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size={420} my={60} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Center mb="xl">
        <Stack align="center" gap="md">
          <ThemeIcon size={48} color="blue" radius="md">
            <IconBrain size={32} />
          </ThemeIcon>
          <Title order={1} ta="center" fw={800} size="2rem">
            Sign in to AI Atlas
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Geisinger AI Initiatives Registry
          </Text>
        </Stack>
      </Center>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Username"
              placeholder="Enter username"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              autoComplete="username"
              size="md"
            />

            <PasswordInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              autoComplete="current-password"
              size="md"
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

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              size="md"
              mt="sm"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>
        </form>

        <Divider label="Demo Accounts" labelPosition="center" my="lg" />

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>Admin:</Text>
            <Code>admin / admin123</Code>
          </Group>
          <Group justify="space-between">
            <Text size="sm" fw={500}>Reviewer:</Text>
            <Code>reviewer / review123</Code>
          </Group>
          <Group justify="space-between">
            <Text size="sm" fw={500}>Contributor:</Text>
            <Code>contributor / contrib123</Code>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
};

export default LoginForm;