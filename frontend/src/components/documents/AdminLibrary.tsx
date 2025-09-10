import React, { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Text,
  Group,
  Button,
  Card,
  Tabs,
  Badge,
  Alert,
  Modal,
  TextInput,
  Textarea,
  Switch,
  Select
} from '@mantine/core';
import {
  IconSettings,
  IconTemplate,
  IconFileText,
  IconPlus,
  IconEdit,
  IconAlertCircle
} from '@tabler/icons-react';
import DocumentManager from './DocumentManager';
import { DocumentTemplate, DocumentRequirement } from '../../types/document';

const AdminLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [createRequirementOpen, setCreateRequirementOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    placeholders: ''
  });

  const [requirementForm, setRequirementForm] = useState({
    name: '',
    description: '',
    category: '',
    stage: '',
    is_mandatory: true,
    template_id: ''
  });

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'requirements') {
      fetchRequirements();
    }
  }, [activeTab]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/admin/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/admin/requirements');
      if (!response.ok) throw new Error('Failed to fetch requirements');
      const data = await response.json();
      setRequirements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('http://localhost:8000/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });

      if (!response.ok) throw new Error('Failed to create template');
      
      setTemplateForm({ name: '', description: '', category: '', placeholders: '' });
      setCreateTemplateOpen(false);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  const handleCreateRequirement = async () => {
    try {
      const requestData = {
        ...requirementForm,
        template_id: requirementForm.template_id ? parseInt(requirementForm.template_id) : undefined
      };

      const response = await fetch('http://localhost:8000/admin/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) throw new Error('Failed to create requirement');
      
      setRequirementForm({
        name: '',
        description: '',
        category: '',
        stage: '',
        is_mandatory: true,
        template_id: ''
      });
      setCreateRequirementOpen(false);
      fetchRequirements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create requirement');
    }
  };

  const handleInstantiateTemplate = async (templateId: number, initiativeId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/admin/templates/${templateId}/instantiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiative_id: initiativeId })
      });

      if (!response.ok) throw new Error('Failed to instantiate template');
      
      // Show success message or redirect
      console.log('Template instantiated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to instantiate template');
    }
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text size="xl" fw={600}>Admin Document Library</Text>
            <Text size="sm" c="dimmed">
              Manage global document templates, requirements, and policies
            </Text>
          </div>
          <Badge color="violet" variant="light" size="lg">
            Admin Only
          </Badge>
        </Group>

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
            <Tabs.Tab value="documents" leftSection={<IconFileText size={16} />}>
              Documents
            </Tabs.Tab>
            <Tabs.Tab value="templates" leftSection={<IconTemplate size={16} />}>
              Templates
            </Tabs.Tab>
            <Tabs.Tab value="requirements" leftSection={<IconSettings size={16} />}>
              Requirements
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="documents">
            <DocumentManager
              libraryType="admin"
              title="Admin Document Library"
              showUpload={true}
            />
          </Tabs.Panel>

          <Tabs.Panel value="templates">
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="lg" fw={500}>Document Templates</Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setCreateTemplateOpen(true)}
                >
                  Create Template
                </Button>
              </Group>

              {templates.length === 0 ? (
                <Card withBorder p="xl">
                  <Text ta="center" c="dimmed">No templates found. Create your first template.</Text>
                </Card>
              ) : (
                <div>
                  {templates.map((template) => (
                    <Card key={template.id} withBorder mb="md">
                      <Group justify="space-between">
                        <div>
                          <Text fw={500}>{template.name}</Text>
                          {template.description && (
                            <Text size="sm" c="dimmed">{template.description}</Text>
                          )}
                          <Group gap="xs" mt="xs">
                            {template.category && (
                              <Badge variant="outline" size="sm">{template.category}</Badge>
                            )}
                            <Badge color={template.is_active ? 'green' : 'gray'} size="sm">
                              {template.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </Group>
                        </div>
                        <Group gap="sm">
                          <Button size="sm" variant="subtle">
                            <IconEdit size={16} />
                          </Button>
                          <Button size="sm" variant="outline">
                            Instantiate
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </div>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="requirements">
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="lg" fw={500}>Document Requirements</Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setCreateRequirementOpen(true)}
                >
                  Create Requirement
                </Button>
              </Group>

              {requirements.length === 0 ? (
                <Card withBorder p="xl">
                  <Text ta="center" c="dimmed">No requirements found. Create your first requirement.</Text>
                </Card>
              ) : (
                <div>
                  {requirements.map((requirement) => (
                    <Card key={requirement.id} withBorder mb="md">
                      <Group justify="space-between">
                        <div>
                          <Text fw={500}>{requirement.name}</Text>
                          {requirement.description && (
                            <Text size="sm" c="dimmed">{requirement.description}</Text>
                          )}
                          <Group gap="xs" mt="xs">
                            {requirement.category && (
                              <Badge variant="outline" size="sm">{requirement.category}</Badge>
                            )}
                            {requirement.stage && (
                              <Badge color="blue" variant="light" size="sm">{requirement.stage}</Badge>
                            )}
                            <Badge color={requirement.is_mandatory ? 'red' : 'yellow'} size="sm">
                              {requirement.is_mandatory ? 'Mandatory' : 'Optional'}
                            </Badge>
                            {requirement.has_template && (
                              <Badge color="green" variant="light" size="sm">Has Template</Badge>
                            )}
                          </Group>
                        </div>
                        <Group gap="sm">
                          <Button size="sm" variant="subtle">
                            <IconEdit size={16} />
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </div>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Create Template Modal */}
        <Modal
          opened={createTemplateOpen}
          onClose={() => setCreateTemplateOpen(false)}
          title="Create Document Template"
          size="md"
        >
          <Stack gap="sm">
            <TextInput
              label="Template Name"
              required
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            />
            <Textarea
              label="Description"
              value={templateForm.description}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
            />
            <Select
              label="Category"
              data={[
                { value: 'governance', label: 'Governance' },
                { value: 'technical', label: 'Technical' },
                { value: 'compliance', label: 'Compliance' },
                { value: 'training', label: 'Training' }
              ]}
              value={templateForm.category}
              onChange={(value) => setTemplateForm({ ...templateForm, category: value || '' })}
            />
            <Textarea
              label="Placeholders (JSON)"
              description="Define template placeholders as JSON"
              value={templateForm.placeholders}
              onChange={(e) => setTemplateForm({ ...templateForm, placeholders: e.target.value })}
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="subtle" onClick={() => setCreateTemplateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Create Requirement Modal */}
        <Modal
          opened={createRequirementOpen}
          onClose={() => setCreateRequirementOpen(false)}
          title="Create Document Requirement"
          size="md"
        >
          <Stack gap="sm">
            <TextInput
              label="Requirement Name"
              required
              value={requirementForm.name}
              onChange={(e) => setRequirementForm({ ...requirementForm, name: e.target.value })}
            />
            <Textarea
              label="Description"
              value={requirementForm.description}
              onChange={(e) => setRequirementForm({ ...requirementForm, description: e.target.value })}
            />
            <Select
              label="Category"
              data={[
                { value: 'governance', label: 'Governance' },
                { value: 'technical', label: 'Technical' },
                { value: 'compliance', label: 'Compliance' },
                { value: 'training', label: 'Training' }
              ]}
              value={requirementForm.category}
              onChange={(value) => setRequirementForm({ ...requirementForm, category: value || '' })}
            />
            <Select
              label="Stage"
              data={[
                { value: 'planning', label: 'Planning' },
                { value: 'development', label: 'Development' },
                { value: 'testing', label: 'Testing' },
                { value: 'deployment', label: 'Deployment' },
                { value: 'monitoring', label: 'Monitoring' }
              ]}
              value={requirementForm.stage}
              onChange={(value) => setRequirementForm({ ...requirementForm, stage: value || '' })}
            />
            <Switch
              label="Mandatory Requirement"
              checked={requirementForm.is_mandatory}
              onChange={(e) => setRequirementForm({ ...requirementForm, is_mandatory: e.target.checked })}
            />
            <Select
              label="Associated Template (Optional)"
              data={templates.map(t => ({ value: t.id.toString(), label: t.name }))}
              value={requirementForm.template_id}
              onChange={(value) => setRequirementForm({ ...requirementForm, template_id: value || '' })}
              clearable
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="subtle" onClick={() => setCreateRequirementOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRequirement}>
                Create Requirement
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};

export default AdminLibrary;