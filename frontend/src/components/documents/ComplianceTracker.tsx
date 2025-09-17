import React, { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Text,
  Group,
  Card,
  Progress,
  Badge,
  Button,
  Table,
  Alert,
  ActionIcon,
  Tooltip,
  Modal,
  Textarea,
  Select,
  Grid,
  RingProgress,
  Center
} from '@mantine/core';
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconDownload,
  IconEye,
  IconFileCheck,
  IconFileX,
  IconNotes,
  IconCalendar,
  IconTarget
} from '@tabler/icons-react';
import type { DocumentRequirement, ComplianceStatus } from '../../types/document';

interface ComplianceTrackerProps {
  initiativeId: number;
}

interface ComplianceNote {
  id: number;
  requirement_id: number;
  note: string;
  created_by: string;
  created_at: string;
  note_type: 'compliance' | 'risk' | 'exemption';
}

const ComplianceTracker: React.FC<ComplianceTrackerProps> = ({ initiativeId }) => {
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [complianceNotes, setComplianceNotes] = useState<ComplianceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<DocumentRequirement | null>(null);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'compliance' | 'risk' | 'exemption'>('compliance');

  useEffect(() => {
    fetchComplianceData();
  }, [initiativeId]);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch compliance status
      const statusResponse = await fetch(`http://localhost:8000/initiatives/${initiativeId}/compliance`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setComplianceStatus(statusData);
      }

      // Fetch requirements
      const reqResponse = await fetch(`http://localhost:8000/initiatives/${initiativeId}/requirements`);
      if (reqResponse.ok) {
        const reqData = await reqResponse.json();
        setRequirements(reqData);
      }

      // Fetch compliance notes
      const notesResponse = await fetch(`http://localhost:8000/initiatives/${initiativeId}/compliance-notes`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setComplianceNotes(notesData);
      }
    } catch (err) {
      console.error('Error fetching compliance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedRequirement || !newNote.trim()) return;

    try {
      const response = await fetch(`http://localhost:8000/initiatives/${initiativeId}/compliance-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement_id: selectedRequirement.id,
          note: newNote.trim(),
          note_type: noteType,
          created_by: 'Current User' // Replace with actual user context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add compliance note');
      }

      setNewNote('');
      setNoteModalOpen(false);
      setSelectedRequirement(null);
      fetchComplianceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  const generateComplianceReport = async () => {
    try {
      const response = await fetch(`http://localhost:8000/initiatives/${initiativeId}/compliance-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to generate compliance report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `compliance-report-initiative-${initiativeId}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'green';
      case 'mostly-compliant': return 'lime';
      case 'partially-compliant': return 'yellow';
      case 'non-compliant': return 'red';
      default: return 'gray';
    }
  };

  const getRiskLevel = (compliancePercentage: number) => {
    if (compliancePercentage >= 90) return { level: 'Low', color: 'green' };
    if (compliancePercentage >= 70) return { level: 'Medium', color: 'yellow' };
    if (compliancePercentage >= 50) return { level: 'High', color: 'orange' };
    return { level: 'Critical', color: 'red' };
  };

  const getRequirementNotes = (requirementId: number) => {
    return complianceNotes.filter(note => note.requirement_id === requirementId);
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'compliance': return 'blue';
      case 'risk': return 'orange';
      case 'exemption': return 'purple';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="md">
        <Center h={400}>
          <Text>Loading compliance data...</Text>
        </Center>
      </Container>
    );
  }

  if (!complianceStatus) {
    return (
      <Container size="xl" py="md">
        <Alert color="blue" title="No compliance data available">
          Compliance tracking data is not available for this initiative.
        </Alert>
      </Container>
    );
  }

  const risk = getRiskLevel(complianceStatus.compliance_percentage);

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text size="xl" fw={600}>Compliance Tracker</Text>
            <Text size="sm" c="dimmed">
              Monitor document compliance and regulatory requirements
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={generateComplianceReport}
              variant="outline"
            >
              Export Report
            </Button>
          </Group>
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert color="red" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        {/* Compliance Overview */}
        <Grid>
          <Grid.Col span={8}>
            <Card withBorder h="100%">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600} size="lg">Compliance Overview</Text>
                  <Badge 
                    color={getComplianceColor(complianceStatus.status)} 
                    variant="filled"
                    size="lg"
                  >
                    {complianceStatus.status.toUpperCase().replace('-', ' ')}
                  </Badge>
                </Group>
                
                <Progress
                  value={complianceStatus.compliance_percentage}
                  color={getComplianceColor(complianceStatus.status)}
                  size="xl"
                  radius="xl"
                />
                
                <Group justify="space-between">
                  <Group gap="xl">
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase">Total</Text>
                      <Text size="xl" fw={700}>{complianceStatus.total_required}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase">Completed</Text>
                      <Text size="xl" fw={700} c="green">{complianceStatus.completed}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase">Missing</Text>
                      <Text size="xl" fw={700} c="red">
                        {complianceStatus.total_required - complianceStatus.completed}
                      </Text>
                    </div>
                  </Group>
                  <Text size="xl" fw={700}>
                    {complianceStatus.compliance_percentage}%
                  </Text>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={4}>
            <Card withBorder h="100%">
              <Stack gap="md" align="center" justify="center" h="100%">
                <RingProgress
                  size={120}
                  thickness={12}
                  sections={[
                    { 
                      value: complianceStatus.compliance_percentage, 
                      color: risk.color 
                    }
                  ]}
                  label={
                    <Center>
                      <Stack align="center" gap="xs">
                        <Text size="xs" c="dimmed" tt="uppercase">Risk Level</Text>
                        <Text fw={700} c={risk.color}>{risk.level}</Text>
                      </Stack>
                    </Center>
                  }
                />
                <Group gap="xs">
                  <IconTarget size={16} color={risk.color} />
                  <Text size="sm" fw={500}>Compliance Target: 100%</Text>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Missing Requirements Alert */}
        {complianceStatus.missing.length > 0 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Missing Requirements"
            color="red"
          >
            <Text size="sm">
              The following requirements are missing: {complianceStatus.missing.join(', ')}
            </Text>
          </Alert>
        )}

        {/* Detailed Requirements Table */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} size="lg">Requirement Details</Text>
              <Button size="sm" variant="subtle" onClick={fetchComplianceData}>
                Refresh
              </Button>
            </Group>

            <Table.ScrollContainer minWidth={800}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Requirement</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Stage</Table.Th>
                    <Table.Th>Notes</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {requirements.map((requirement) => {
                    const notes = getRequirementNotes(requirement.id);
                    return (
                      <Table.Tr key={requirement.id}>
                        <Table.Td>
                          <Group gap="xs">
                            {requirement.is_uploaded ? (
                              <IconFileCheck color="green" size={20} />
                            ) : (
                              <IconFileX color="red" size={20} />
                            )}
                            <Badge
                              color={requirement.is_uploaded ? 'green' : 'red'}
                              variant="light"
                              size="sm"
                            >
                              {requirement.is_uploaded ? 'Complete' : 'Missing'}
                            </Badge>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap="xs">
                            <Text fw={500} size="sm">{requirement.name}</Text>
                            {requirement.description && (
                              <Text size="xs" c="dimmed" lineClamp={2}>
                                {requirement.description}
                              </Text>
                            )}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={requirement.is_mandatory ? 'red' : 'yellow'}
                            variant="light"
                          >
                            {requirement.is_mandatory ? 'Mandatory' : 'Optional'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {requirement.stage && (
                            <Badge variant="outline" size="sm">
                              {requirement.stage}
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Text size="sm">{notes.length}</Text>
                            {notes.length > 0 && (
                              <Group gap="xs">
                                {notes.map(note => (
                                  <Badge
                                    key={note.id}
                                    size="xs"
                                    color={getNoteTypeColor(note.note_type)}
                                    variant="dot"
                                  >
                                    {note.note_type}
                                  </Badge>
                                ))}
                              </Group>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="View details">
                              <ActionIcon variant="subtle" size="sm">
                                <IconEye size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Add note">
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequirement(requirement);
                                  setNoteModalOpen(true);
                                }}
                              >
                                <IconNotes size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Card>

        {/* Add Note Modal */}
        <Modal
          opened={noteModalOpen}
          onClose={() => {
            setNoteModalOpen(false);
            setSelectedRequirement(null);
            setNewNote('');
          }}
          title={`Add Note - ${selectedRequirement?.name}`}
          size="md"
        >
          <Stack gap="sm">
            <Select
              label="Note Type"
              data={[
                { value: 'compliance', label: 'Compliance Note' },
                { value: 'risk', label: 'Risk Assessment' },
                { value: 'exemption', label: 'Exemption Request' }
              ]}
              value={noteType}
              onChange={(value) => setNoteType(value as typeof noteType)}
            />
            <Textarea
              label="Note"
              placeholder="Enter your compliance note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              minRows={4}
            />
            <Group justify="flex-end" gap="sm">
              <Button 
                variant="subtle" 
                onClick={() => {
                  setNoteModalOpen(false);
                  setSelectedRequirement(null);
                  setNewNote('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                Add Note
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};

export default ComplianceTracker;
