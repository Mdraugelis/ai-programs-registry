import React, { useState } from 'react';
import {
  Stack,
  TextInput,
  Textarea,
  Group,
  Button,
  Card,
  Text,
  Chip,
  ChipGroup,
  Alert,
  LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconCheck, IconX } from '@tabler/icons-react';
import DocumentDropZone from '../shared/documents/DocumentDropZone';
import { ancillaryDocumentsAPI } from '../../services/api';
import type { AncillaryDocumentUploadProps } from '../../types/document';


interface DocumentMetadata {
  description: string;
  tags: string;
  category: string;
}

const PREDEFINED_TAGS = [
  'research', 'presentation', 'analysis', 'training', 'technical', 
  'reference', 'media', 'correspondence', 'draft', 'final'
];

const DOCUMENT_CATEGORIES = [
  { value: 'research', label: 'Research & Reference' },
  { value: 'technical', label: 'Technical Documentation' },
  { value: 'training', label: 'Training Materials' },
  { value: 'presentations', label: 'Presentations' },
  { value: 'reports', label: 'Reports & Analysis' },
  { value: 'media', label: 'Media & Assets' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' }
];

const AncillaryDocumentUpload: React.FC<AncillaryDocumentUploadProps> = ({
  initiativeId,
  onUploadSuccess,
  onUploadError,
  disabled = false
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [customTags, setCustomTags] = useState<string[]>([]);

  const form = useForm<DocumentMetadata>({
    initialValues: {
      description: '',
      tags: '',
      category: 'other'
    },
    validate: {
      description: (value) => 
        value.length < 10 ? 'Description must be at least 10 characters' : null,
      category: (value) => 
        value.length < 1 ? 'Please select a category' : null
    }
  });

  const handleFileDrop = (droppedFiles: File[]) => {
    setFiles(droppedFiles);
    if (droppedFiles.length > 0) {
      notifications.show({
        title: 'Files Ready',
        message: `${droppedFiles.length} file(s) selected for upload`,
        color: 'blue',
        icon: <IconInfoCircle size={16} />
      });
    }
  };

  const handleTagInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const input = event.currentTarget;
      const tag = input.value.trim().toLowerCase();
      
      if (tag && !customTags.includes(tag) && !PREDEFINED_TAGS.includes(tag)) {
        setCustomTags([...customTags, tag]);
        input.value = '';
      }
    }
  };

  const removeCustomTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  const getAllTags = () => {
    const selectedPredefined = form.values.tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    return [...selectedPredefined, ...customTags].join(',');
  };

  const handleUpload = async () => {
    console.log('Upload attempt:', { filesCount: files.length, initiativeId, formValues: form.values });
    
    if (files.length === 0) {
      notifications.show({
        title: 'No Files Selected',
        message: 'Please select files to upload',
        color: 'yellow',
        icon: <IconX size={16} />
      });
      return;
    }

    if (!initiativeId) {
      notifications.show({
        title: 'No Initiative ID',
        message: 'Documents cannot be uploaded without a saved initiative',
        color: 'yellow',
        icon: <IconX size={16} />
      });
      return;
    }

    const validation = form.validate();
    console.log('Form validation:', validation);
    
    if (!validation.hasErrors) {
      setUploading(true);
      
      try {
        const metadata = {
          description: form.values.description,
          tags: getAllTags(),
          category: form.values.category
        };

        const uploadedDocuments = await ancillaryDocumentsAPI.uploadMultiple(
          initiativeId,
          files,
          metadata
        );

        notifications.show({
          title: 'Upload Successful',
          message: `${files.length} ancillary document(s) uploaded successfully`,
          color: 'green',
          icon: <IconCheck size={16} />
        });

        // Reset form and files
        form.reset();
        setFiles([]);
        setCustomTags([]);
        
        onUploadSuccess?.(uploadedDocuments);
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        notifications.show({
          title: 'Upload Failed',
          message: errorMessage,
          color: 'red',
          icon: <IconX size={16} />
        });
        onUploadError?.(errorMessage);
      } finally {
        setUploading(false);
      }
    } else {
      console.log('Form validation failed, not uploading');
    }
  };

  const handleCancel = () => {
    setFiles([]);
    form.reset();
    setCustomTags([]);
  };

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Stack gap="sm">
          <Text size="lg" fw={600}>Upload Ancillary Documents</Text>
          <Text size="sm" c="dimmed">
            Upload supporting materials like research papers, presentations, training materials, 
            and other resources related to this AI initiative.
          </Text>
        </Stack>
      </Card>

      <DocumentDropZone
        onDrop={handleFileDrop}
        accept={[
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'image/jpeg',
          'image/png',
          'image/gif'
        ]}
        maxSize={50 * 1024 * 1024} // 50MB
        multiple={true}
        disabled={disabled || uploading}
        libraryType="ancillary"
      />

      {files.length > 0 && (
        <Card withBorder p="md" pos="relative">
          <LoadingOverlay visible={uploading} />
          
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={500}>Document Details</Text>
              <Text size="sm" c="dimmed">{files.length} file(s) selected</Text>
            </Group>

            <form onSubmit={form.onSubmit(handleUpload)}>
              <Stack gap="md">
                <Textarea
                  label="Document Description"
                  placeholder="Describe the purpose and content of these documents..."
                  required
                  minRows={3}
                  {...form.getInputProps('description')}
                />

                <Group>
                  <Text size="sm" fw={500}>Category</Text>
                  <ChipGroup 
                    value={form.values.category} 
                    onChange={(value) => form.setFieldValue('category', value as string)}
                  >
                    <Group>
                      {DOCUMENT_CATEGORIES.map((category) => (
                        <Chip key={category.value} value={category.value}>
                          {category.label}
                        </Chip>
                      ))}
                    </Group>
                  </ChipGroup>
                </Group>

                <div>
                  <Text size="sm" fw={500} mb="xs">Tags (Select from common tags or add custom ones)</Text>
                  <ChipGroup
                    multiple
                    value={form.values.tags.split(',').filter(t => t.trim().length > 0)}
                    onChange={(values) => form.setFieldValue('tags', values.join(','))}
                  >
                    <Group mb="sm">
                      {PREDEFINED_TAGS.map((tag) => (
                        <Chip key={tag} value={tag}>
                          {tag}
                        </Chip>
                      ))}
                    </Group>
                  </ChipGroup>

                  <TextInput
                    placeholder="Add custom tags (press Enter or comma to add)"
                    onKeyDown={handleTagInput}
                    size="sm"
                  />

                  {customTags.length > 0 && (
                    <Group mt="xs">
                      <Text size="xs" c="dimmed">Custom tags:</Text>
                      {customTags.map((tag) => (
                        <Chip 
                          key={tag} 
                          variant="filled" 
                          size="sm"
                          onRemove={() => removeCustomTag(tag)}
                        >
                          {tag}
                        </Chip>
                      ))}
                    </Group>
                  )}
                </div>

                {!initiativeId && (
                  <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
                    <Text size="sm">
                      These documents will be uploaded when the initiative is saved.
                    </Text>
                  </Alert>
                )}

                <Group justify="flex-end">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    loading={uploading}
                    disabled={files.length === 0}
                  >
                    Upload Documents
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};

export default AncillaryDocumentUpload;