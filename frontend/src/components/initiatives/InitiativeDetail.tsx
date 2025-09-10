import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Container, Paper, Title, Text, Badge, Button, 
  Grid, Group, Stack, Anchor, Divider
} from '@mantine/core';
import { IconArrowLeft, IconEdit } from '@tabler/icons-react';
import { useInitiatives } from '../../contexts/InitiativesContext';

const InitiativeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getInitiative, fetchInitiatives } = useInitiatives();

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  const initiative = id ? getInitiative(id) : null;

  if (!initiative) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder>
          <Stack align="center" gap="md">
            <Title order={2} c="dimmed">Initiative not found</Title>
            <Anchor component={Link} to="/initiatives" size="sm">
              <Group gap="xs">
                <IconArrowLeft size={16} />
                Back to initiatives
              </Group>
            </Anchor>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const getStageColor = (stage: string): string => {
    switch (stage?.toLowerCase()) {
      case 'idea':
        return 'gray';
      case 'discovery':
        return 'blue';
      case 'design':
        return 'green';
      case 'build':
        return 'orange';
      case 'pilot':
        return 'pink';
      case 'operational':
        return 'red';
      case 'retired':
        return 'dark';
      case 'paused':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap="sm">
            <Anchor component={Link} to="/initiatives" size="sm">
              <Group gap="xs">
                <IconArrowLeft size={16} />
                Back to initiatives
              </Group>
            </Anchor>
            <Title order={1} size="2rem">{initiative.title}</Title>
          </Stack>
          <Button
            component={Link}
            to={`/initiatives/${initiative.id}/edit`}
            leftSection={<IconEdit size={16} />}
            variant="filled"
          >
            Edit Initiative
          </Button>
        </Group>

        {/* Overview Card */}
        <Paper p="xl" withBorder>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Stage</Text>
                <Badge color={getStageColor(initiative.stage)} variant="light" size="lg">
                  {initiative.stage}
                </Badge>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Program Owner</Text>
                <Text size="sm">{initiative.program_owner}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Department</Text>
                <Text size="sm">{initiative.department}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Executive Champion</Text>
                <Text size="sm">{initiative.executive_champion}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Created</Text>
                <Text size="sm">
                  {new Date(initiative.created_at).toLocaleDateString()}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Last Updated</Text>
                <Text size="sm">
                  {new Date(initiative.updated_at).toLocaleDateString()}
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Background & Goals */}
        <Paper p="xl" withBorder>
          <Title order={2} size="lg" mb="lg">Background & Goals</Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Background</Text>
                <Text size="sm">{initiative.background || 'Not specified'}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Goal</Text>
                <Text size="sm">{initiative.goal || 'Not specified'}</Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Technical Approach */}
        <Paper p="xl" withBorder>
          <Title order={2} size="lg" mb="lg">Technical Approach</Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Workflow Approach</Text>
                <Text size="sm">{initiative.approach_workflow || 'Not specified'}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Technical Implementation</Text>
                <Text size="sm">{initiative.approach_technical || 'Not specified'}</Text>
              </Stack>
            </Grid.Col>
          </Grid>
          {initiative.ai_components && initiative.ai_components.length > 0 && (
            <>
              <Divider my="md" />
              <Stack gap="sm">
                <Text size="sm" fw={500} c="dimmed">AI Components</Text>
                <Group gap="xs">
                  {initiative.ai_components.map((component, index) => (
                    <Badge
                      key={index}
                      variant="light"
                      color="blue"
                      size="sm"
                    >
                      {component}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </>
          )}
        </Paper>

        {/* Risk & Governance */}
        <Paper p="xl" withBorder>
          <Title order={2} size="lg" mb="lg">Risk & Governance</Title>
          <Stack gap="lg">
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Risk Assessment</Text>
              <Text size="sm">{initiative.risks || 'Not specified'}</Text>
            </Stack>
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Equity Considerations</Text>
              <Text size="sm">{initiative.equity_considerations || 'Not specified'}</Text>
            </Stack>
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Benefits</Text>
              <Text size="sm">{initiative.benefits || 'Not specified'}</Text>
            </Stack>
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Success Metrics</Text>
              <Text size="sm">{initiative.success_metrics || 'Not specified'}</Text>
            </Stack>
          </Stack>
        </Paper>

        {/* Vendor Information */}
        {(initiative.vendor_type || initiative.vendors) && (
          <Paper p="xl" withBorder>
            <Title order={2} size="lg" mb="lg">Vendor Information</Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="dimmed">Vendor Type</Text>
                  <Text size="sm">{initiative.vendor_type || 'Not specified'}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="dimmed">Vendors</Text>
                  <Text size="sm">{initiative.vendors || 'Not specified'}</Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

export default InitiativeDetail;