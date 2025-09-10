import React, { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Text,
  Group,
  Card,
  Progress,
  Badge,
  Alert,
  Button,
  Tabs,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconFileCheck,
  IconFileX,
  IconDownload,
  IconAlertCircle,
  IconCheckbox,
  IconTemplate
} from '@tabler/icons-react';
import DocumentManager from './DocumentManager';
import { DocumentRequirement, ComplianceStatus } from '../../types/document';

interface CoreDocumentsProps {
  initiativeId: number;
}

const CoreDocuments: React.FC<CoreDocumentsProps> = ({ initiativeId }) => {
  const [activeTab, setActiveTab] = useState('documents');
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'requirements') {
      fetchRequirements();
    } else if (activeTab === 'compliance') {
      fetchComplianceStatus();
    }
  }, [activeTab, initiativeId]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/initiatives/${initiativeId}/requirements`);
      if (!response.ok) throw new Error('Failed to fetch requirements');
      const data = await response.json();
      setRequirements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requirements');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/initiatives/${initiativeId}/compliance`);
      if (!response.ok) throw new Error('Failed to fetch compliance status');
      const data = await response.json();
      setComplianceStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch compliance status');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantiateTemplate = async (templateId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/admin/templates/${templateId}/instantiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiative_id: initiativeId })
      });

      if (!response.ok) throw new Error('Failed to instantiate template');
      
      // Refresh the documents list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to instantiate template');
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

  const getRequirementStatusIcon = (requirement: DocumentRequirement) => {
    if (requirement.is_uploaded) {
      return <IconFileCheck color="green" size={20} />;
    }
    return <IconFileX color={requirement.is_mandatory ? 'red' : 'orange'} size={20} />;
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text size="xl" fw={600}>Core Governance Documents</Text>
            <Text size="sm" c="dimmed">
              Required documents and compliance artifacts for this initiative
            </Text>
          </div>
          <Badge color="blue" variant="light" size="lg">
            Core Library
          </Badge>
        </Group>

        {/* Compliance Overview */}
        {complianceStatus && (
          <Card withBorder p="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={500}>Compliance Overview</Text>
                <Badge color={getComplianceColor(complianceStatus.status)} variant="light">
                  {complianceStatus.status.toUpperCase().replace('-', ' ')}
                </Badge>
              </Group>
              <Progress 
                value={complianceStatus.compliance_percentage} 
                color={getComplianceColor(complianceStatus.status)}
                size="lg"
                radius="xl"
              />
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {complianceStatus.completed} of {complianceStatus.total_required} requirements completed
                </Text>
                <Text size="sm" fw={500}>
                  {complianceStatus.compliance_percentage}%
                </Text>
              </Group>
              {complianceStatus.missing.length > 0 && (
                <Alert color="orange" variant="light" mt="sm">
                  <Text size="sm" fw={500}>Missing Requirements:</Text>
                  <Text size="sm">
                    {complianceStatus.missing.join(', ')}
                  </Text>
                </Alert>
              )}
            </Stack>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="documents" leftSection={<IconFileCheck size={16} />}>
              Documents
            </Tabs.Tab>
            <Tabs.Tab value="requirements" leftSection={<IconCheckbox size={16} />}>
              Requirements
            </Tabs.Tab>
            <Tabs.Tab value="compliance" leftSection={<IconFileCheck size={16} />}>
              Compliance
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="documents">
            <DocumentManager
              initiativeId={initiativeId}
              libraryType="core"
              title="Core Documents"
              category="governance"
              showUpload={true}
            />
          </Tabs.Panel>

          <Tabs.Panel value="requirements">
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="lg" fw={500}>Document Requirements</Text>
                <Button variant="outline" onClick={fetchRequirements}>
                  Refresh
                </Button>
              </Group>

              {requirements.length === 0 ? (
                <Card withBorder p="xl">
                  <Text ta="center" c="dimmed">
                    No requirements found for this initiative.
                  </Text>
                </Card>
              ) : (
                <Stack gap="sm">
                  {requirements.map((requirement) => (
                    <Card key={requirement.id} withBorder>
                      <Group justify="space-between">
                        <Group gap="md">
                          <div style={{ minWidth: '24px' }}>
                            {getRequirementStatusIcon(requirement)}
                          </div>
                          <div>
                            <Group gap="sm">
                              <Text fw={500}>{requirement.name}</Text>
                              <Badge
                                color={requirement.is_mandatory ? 'red' : 'yellow'}
                                variant="light"
                                size="sm"
                              >
                                {requirement.is_mandatory ? 'Mandatory' : 'Optional'}
                              </Badge>
                              {requirement.stage && (
                                <Badge color="blue" variant="outline" size="sm">
                                  {requirement.stage}
                                </Badge>
                              )}
                            </Group>
                            {requirement.description && (
                              <Text size="sm" c="dimmed" mt="xs">
                                {requirement.description}
                              </Text>
                            )}
                            {requirement.category && (
                              <Badge variant="dot" size="sm" mt="xs">
                                {requirement.category}
                              </Badge>
                            )}
                          </div>
                        </Group>
                        
                        <Group gap="sm">
                          {requirement.has_template && (
                            <Tooltip label="Use template">
                              <ActionIcon 
                                variant="subtle" 
                                color="blue"
                                onClick={() => handleInstantiateTemplate(requirement.template_id!)}
                              >
                                <IconTemplate size={18} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          {requirement.is_uploaded ? (
                            <Badge color="green" variant="light" size="sm">
                              Uploaded
                            </Badge>
                          ) : (
                            <Badge color="red" variant="light" size="sm">
                              Missing
                            </Badge>
                          )}
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="compliance">
            <Stack gap="md">
              <Text size="lg" fw={500}>Compliance Tracking</Text>
              
              {complianceStatus ? (
                <Stack gap="md">
                  <Card withBorder p="md">
                    <Group justify="space-between" mb="md">
                      <Text fw={500}>Overall Compliance Status</Text>
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
                      mb="md"
                    />
                    
                    <Group justify="space-between">
                      <Group gap="xl">
                        <div>
                          <Text size="sm" c="dimmed">Total Requirements</Text>
                          <Text size="xl" fw={700}>{complianceStatus.total_required}</Text>
                        </div>
                        <div>
                          <Text size="sm" c="dimmed">Completed</Text>
                          <Text size="xl" fw={700} c="green">{complianceStatus.completed}</Text>
                        </div>
                        <div>
                          <Text size="sm" c="dimmed">Remaining</Text>
                          <Text size="xl" fw={700} c="red">
                            {complianceStatus.total_required - complianceStatus.completed}
                          </Text>
                        </div>
                      </Group>
                    </Group>
                  </Card>

                  {complianceStatus.missing.length > 0 && (
                    <Card withBorder>
                      <Stack gap="sm">
                        <Text fw={500} c="red">Missing Requirements</Text>
                        {complianceStatus.missing.map((missing, index) => (
                          <Group key={index} gap="sm">
                            <IconFileX color="red" size={16} />
                            <Text size="sm">{missing}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Card>
                  )}

                  <Group justify="center" mt="lg">
                    <Button 
                      leftSection={<IconDownload size={16} />}
                      variant="outline"
                    >
                      Export Compliance Report
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Card withBorder p="xl">
                  <Text ta="center" c="dimmed">
                    Click refresh to load compliance status
                  </Text>
                  <Group justify="center" mt="md">
                    <Button onClick={fetchComplianceStatus}>
                      Load Compliance Status
                    </Button>
                  </Group>
                </Card>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default CoreDocuments;