import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Button,
  Group,
  Stack,
  Grid,
  Accordion,
  Loader,
  Alert,
  Badge,
  Box
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconDeviceFloppy, IconX, IconCheck } from '@tabler/icons-react';
import { useInitiatives } from '../../contexts/InitiativesContext';
import { useAuth } from '../../contexts/AuthContext';
import { departments, aiComponents, stages } from '../../services/mockData';
import AncillaryDocumentUpload from '../documents/AncillaryDocumentUpload';
import AncillaryDocumentList from '../documents/AncillaryDocumentList';
import type { AncillaryDocument } from '../../types/document';

interface FormData {
  title: string;
  program_owner: string;
  executive_champion: string;
  department: string;
  vendor_type?: string;
  vendors?: string;
  background?: string;
  goal?: string;
  approach_workflow?: string;
  approach_technical?: string;
  ai_components?: string[];
  success_metrics?: string;
  equity_considerations?: string;
  risks?: string;
  benefits?: string;
  stage: 'idea' | 'proposal' | 'pilot' | 'production' | 'retired';
}

const vendorTypeOptions = [
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Open Source', label: 'Open Source' },
  { value: 'Internal', label: 'Internal Development' },
  { value: 'Hybrid', label: 'Hybrid' }
];

const IntakeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { createInitiative, updateInitiative, getInitiative } = useInitiatives();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ancillaryDocuments, setAncillaryDocuments] = useState<AncillaryDocument[]>([]);
  const [documentCount, setDocumentCount] = useState(0);

  const isEditing = Boolean(id);
  const existingInitiative = id ? getInitiative(id) : null;

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
    getValues
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      program_owner: '',
      executive_champion: '',
      department: '',
      vendor_type: '',
      vendors: '',
      background: '',
      goal: '',
      approach_workflow: '',
      approach_technical: '',
      ai_components: [],
      success_metrics: '',
      equity_considerations: '',
      risks: '',
      benefits: '',
      stage: 'idea'
    }
  });

  // Load existing data for editing
  useEffect(() => {
    if (isEditing && existingInitiative) {
      reset({
        title: existingInitiative.title || '',
        program_owner: existingInitiative.program_owner || '',
        executive_champion: existingInitiative.executive_champion || '',
        department: existingInitiative.department || '',
        vendor_type: existingInitiative.vendor_type || '',
        vendors: existingInitiative.vendors || '',
        background: existingInitiative.background || '',
        goal: existingInitiative.goal || '',
        approach_workflow: existingInitiative.approach_workflow || '',
        approach_technical: existingInitiative.approach_technical || '',
        ai_components: existingInitiative.ai_components || [],
        success_metrics: existingInitiative.success_metrics || '',
        equity_considerations: existingInitiative.equity_considerations || '',
        risks: existingInitiative.risks || '',
        benefits: existingInitiative.benefits || '',
        stage: existingInitiative.stage || 'idea'
      });
    }
  }, [isEditing, existingInitiative, reset]);

  // Auto-save draft functionality
  useEffect(() => {
    const subscription = watch((data) => {
      if (isDirty && !isEditing) {
        localStorage.setItem('initiative_draft', JSON.stringify(data));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isDirty, isEditing]);

  // Load draft on component mount
  useEffect(() => {
    if (!isEditing) {
      const draft = localStorage.getItem('initiative_draft');
      if (draft) {
        try {
          const draftData = JSON.parse(draft);
          Object.keys(draftData).forEach(key => {
            if (draftData[key] !== null && draftData[key] !== undefined && draftData[key] !== '') {
              setValue(key as keyof FormData, draftData[key]);
            }
          });
          notifications.show({
            title: 'Draft Loaded',
            message: 'Your previous draft has been restored',
            color: 'blue',
            icon: <IconDeviceFloppy size={16} />
          });
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [isEditing, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setError('You must be logged in to submit an initiative');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isEditing && existingInitiative) {
        await updateInitiative(existingInitiative.id, data);
        notifications.show({
          title: 'Success',
          message: 'Initiative updated successfully',
          color: 'green',
          icon: <IconCheck size={16} />
        });
        // Stay on the same initiative detail page after update
        navigate(`/initiatives/${existingInitiative.id}`);
      } else {
        const newInitiative = await createInitiative({
          ...data,
          created_by: user.email
        });
        localStorage.removeItem('initiative_draft');
        notifications.show({
          title: 'Success',
          message: 'Initiative submitted successfully',
          color: 'green',
          icon: <IconCheck size={16} />
        });
        // Navigate to the new initiative detail page
        if (newInitiative && newInitiative.id) {
          navigate(`/initiatives/${newInitiative.id}`);
        } else {
          navigate('/initiatives');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save initiative';
      setError(errorMessage);
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
      console.error('Failed to save initiative:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('initiative_draft');
    reset();
    notifications.show({
      title: 'Draft Cleared',
      message: 'Your draft has been cleared',
      color: 'orange'
    });
  };

  const handleCancel = () => {
    navigate('/initiatives');
  };

  const handleDocumentUploadSuccess = (documents: AncillaryDocument[]) => {
    setAncillaryDocuments(prev => [...prev, ...documents]);
    setDocumentCount(prev => prev + documents.length);
    notifications.show({
      title: 'Documents Uploaded',
      message: `${documents.length} document(s) uploaded successfully`,
      color: 'green'
    });
  };

  const handleDocumentDelete = (documentId: number) => {
    setAncillaryDocuments(prev => prev.filter(doc => doc.id !== documentId));
    setDocumentCount(prev => prev - 1);
  };

  const refreshDocuments = () => {
    // This will be handled by the AncillaryDocumentList component
    // which will refetch documents from the API
  };

  if (isLoading && !getValues().title) {
    return (
      <Container size="lg" py="xl">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" />
            <Text mt="md" c="dimmed">Loading form...</Text>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Paper p="xl" withBorder>
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <Stack gap="xs">
            <Title order={1} size="h2">
              {isEditing ? 'Edit Initiative' : 'New AI Initiative'}
            </Title>
            <Text c="dimmed">
              {isEditing ? 'Update your AI initiative details' : 'Submit a new AI initiative for review'}
            </Text>
          </Stack>
          
          {!isEditing && isDirty && (
            <Button
              variant="subtle"
              color="gray"
              onClick={clearDraft}
              leftSection={<IconX size={16} />}
            >
              Clear Draft
            </Button>
          )}
        </Group>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            mb="md"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Accordion multiple defaultValue={['basic']} variant="separated">
            {/* Basic Information Section */}
            <Accordion.Item value="basic">
              <Accordion.Control>
                <Group>
                  <Title order={3}>Basic Information</Title>
                  <Badge color="red" size="sm">Required</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Controller
                        name="title"
                        control={control}
                        rules={{ required: 'Title is required' }}
                        render={({ field }) => (
                          <TextInput
                            {...field}
                            label="Initiative Title"
                            placeholder="Enter initiative title"
                            required
                            error={errors.title?.message}
                          />
                        )}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Controller
                        name="department"
                        control={control}
                        rules={{ required: 'Department is required' }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label="Department"
                            placeholder="Select department"
                            data={departments.map(dept => ({ value: dept, label: dept }))}
                            required
                            error={errors.department?.message}
                            searchable
                          />
                        )}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Controller
                        name="program_owner"
                        control={control}
                        rules={{ required: 'Program owner is required' }}
                        render={({ field }) => (
                          <TextInput
                            {...field}
                            label="Program Owner"
                            placeholder="Enter program owner name"
                            required
                            error={errors.program_owner?.message}
                          />
                        )}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Controller
                        name="executive_champion"
                        control={control}
                        rules={{ required: 'Executive champion is required' }}
                        render={({ field }) => (
                          <TextInput
                            {...field}
                            label="Executive Champion"
                            placeholder="Enter executive champion name"
                            required
                            error={errors.executive_champion?.message}
                          />
                        )}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Controller
                        name="stage"
                        control={control}
                        rules={{ required: 'Stage is required' }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label="Current Stage"
                            placeholder="Select current stage"
                            data={stages}
                            required
                            error={errors.stage?.message}
                          />
                        )}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Controller
                        name="vendor_type"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label="Vendor Type"
                            placeholder="Select vendor type"
                            data={vendorTypeOptions}
                            clearable
                          />
                        )}
                      />
                    </Grid.Col>
                  </Grid>
                  
                  <Controller
                    name="vendors"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        {...field}
                        label="Vendors"
                        placeholder="e.g., Microsoft, Google, Internal Team"
                        description="List the vendors or partners involved in this initiative"
                      />
                    )}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Problem & Goals Section */}
            <Accordion.Item value="problem">
              <Accordion.Control>
                <Title order={3}>Problem & Goals</Title>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Controller
                    name="background"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Background & Problem Statement"
                        placeholder="Describe the current problem or opportunity this initiative addresses..."
                        rows={4}
                        description="Provide context about why this AI initiative is needed"
                      />
                    )}
                  />
                  
                  <Controller
                    name="goal"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Goals & Expected Outcomes"
                        placeholder="What specific goals will this initiative achieve? What are the expected outcomes?"
                        rows={4}
                        description="Define clear, measurable objectives for the initiative"
                      />
                    )}
                  />
                  
                  <Controller
                    name="success_metrics"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Success Metrics"
                        placeholder="How will you measure success? Include specific metrics, KPIs, or outcomes..."
                        rows={3}
                        description="Specify how success will be measured and tracked"
                      />
                    )}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Technical Approach Section */}
            <Accordion.Item value="technical">
              <Accordion.Control>
                <Title order={3}>Technical Approach</Title>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Controller
                    name="approach_workflow"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Workflow Description"
                        placeholder="Describe how this AI solution will fit into existing workflows..."
                        rows={4}
                        description="Explain how the AI system will integrate with current processes"
                      />
                    )}
                  />
                  
                  <Controller
                    name="approach_technical"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Technical Implementation"
                        placeholder="Describe the technical approach, architecture, models, or algorithms to be used..."
                        rows={4}
                        description="Detail the technical aspects of the AI implementation"
                      />
                    )}
                  />
                  
                  <Box>
                    <Text size="sm" fw={500} mb="sm">AI Components</Text>
                    <Text size="xs" c="dimmed" mb="md">Select all AI technologies that apply to this initiative</Text>
                    <Grid>
                      {aiComponents.map((component) => (
                        <Grid.Col span={{ base: 12, xs: 6, md: 4 }} key={component}>
                          <Controller
                            name="ai_components"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <Checkbox
                                label={component}
                                checked={value?.includes(component) || false}
                                onChange={(event) => {
                                  const currentValue = value || [];
                                  if (event.currentTarget.checked) {
                                    onChange([...currentValue, component]);
                                  } else {
                                    onChange(currentValue.filter((item: string) => item !== component));
                                  }
                                }}
                              />
                            )}
                          />
                        </Grid.Col>
                      ))}
                    </Grid>
                  </Box>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Governance & Risk Section */}
            <Accordion.Item value="governance">
              <Accordion.Control>
                <Title order={3}>Governance & Risk</Title>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Controller
                    name="risks"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Risk Assessment"
                        placeholder="Identify potential risks, their severity (Low/Medium/High), and mitigation strategies..."
                        rows={4}
                        description="Assess potential risks and how they will be mitigated"
                      />
                    )}
                  />
                  
                  <Controller
                    name="equity_considerations"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Equity Considerations"
                        placeholder="How will you ensure fairness and avoid bias? Consider different patient populations, demographics, etc..."
                        rows={4}
                        description="Address how the AI system will ensure equitable outcomes"
                      />
                    )}
                  />
                  
                  <Controller
                    name="benefits"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Expected Benefits"
                        placeholder="What benefits will this initiative provide to patients, staff, and the organization?"
                        rows={4}
                        description="Outline the anticipated positive impacts of this initiative"
                      />
                    )}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Supporting Documents Section */}
            <Accordion.Item value="documents">
              <Accordion.Control>
                <Group>
                  <Title order={3}>Supporting Documents</Title>
                  <Badge color="blue" size="sm">Optional</Badge>
                  {documentCount > 0 && (
                    <Badge color="green" size="sm" variant="light">
                      {documentCount} document{documentCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="lg">
                  <Text size="sm" c="dimmed">
                    Upload supporting materials like research papers, presentations, technical documentation, 
                    training materials, and other resources related to this AI initiative. These documents 
                    will help reviewers better understand your proposal.
                  </Text>

                  {isEditing && id && (
                    <>
                      {/* Document List for Existing Initiatives */}
                      <AncillaryDocumentList 
                        initiativeId={parseInt(id)}
                        onDocumentDelete={handleDocumentDelete}
                        compact={true}
                      />
                      
                      {/* Upload Component for Existing Initiatives */}
                      <AncillaryDocumentUpload
                        initiativeId={parseInt(id)}
                        onUploadSuccess={handleDocumentUploadSuccess}
                        disabled={isLoading}
                      />
                    </>
                  )}

                  {!isEditing && (
                    <Alert color="blue" variant="light">
                      <Text size="sm">
                        <strong>Note:</strong> Documents can be uploaded after the initiative is saved. 
                        Complete the form and submit to enable document uploads.
                      </Text>
                    </Alert>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

          {/* Form Actions */}
          <Group justify="space-between" mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Button
              variant="outline"
              onClick={handleCancel}
              leftSection={<IconX size={16} />}
            >
              Cancel
            </Button>
            
            <Group>
              {!isEditing && isDirty && (
                <Group gap="xs">
                  <IconDeviceFloppy size={16} color="var(--mantine-color-blue-6)" />
                  <Text size="sm" c="dimmed" fs="italic">Draft saved automatically</Text>
                </Group>
              )}
              <Button
                type="submit"
                loading={isLoading}
                leftSection={!isLoading && <IconCheck size={16} />}
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update Initiative' : 'Submit Initiative'}
              </Button>
            </Group>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default IntakeForm;