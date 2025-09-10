import React, { useState } from 'react';
import {
  Container,
  Stack,
  Text,
  Group,
  Badge,
  Tabs,
  Select,
  Card,
  Button,
  TextInput
} from '@mantine/core';
import {
  IconFiles,
  IconPhoto,
  IconFileText,
  IconVideo,
  IconFolderPlus,
  IconSearch
} from '@tabler/icons-react';
import DocumentManager from './DocumentManager';

interface AncillaryDocumentsProps {
  initiativeId: number;
}

const AncillaryDocuments: React.FC<AncillaryDocumentsProps> = ({ initiativeId }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'technical', label: 'Technical Documentation' },
    { value: 'training', label: 'Training Materials' },
    { value: 'presentations', label: 'Presentations' },
    { value: 'reports', label: 'Reports & Analysis' },
    { value: 'media', label: 'Media & Assets' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'research', label: 'Research & Reference' },
    { value: 'other', label: 'Other' }
  ];

  const fileTypes = {
    all: {
      icon: IconFiles,
      color: 'blue',
      label: 'All Documents',
      description: 'All supporting materials and documents'
    },
    documents: {
      icon: IconFileText,
      color: 'gray',
      label: 'Text Documents',
      description: 'PDFs, Word docs, spreadsheets, and text files'
    },
    images: {
      icon: IconPhoto,
      color: 'green',
      label: 'Images & Graphics',
      description: 'Screenshots, diagrams, photos, and graphics'
    },
    media: {
      icon: IconVideo,
      color: 'red',
      label: 'Media Files',
      description: 'Videos, audio files, and multimedia content'
    }
  };

  const getCurrentCategory = () => {
    return selectedCategory !== 'all' ? selectedCategory : undefined;
  };

  const getAcceptedFileTypes = () => {
    switch (activeTab) {
      case 'documents':
        return [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv'
        ];
      case 'images':
        return [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml'
        ];
      case 'media':
        return [
          'video/mp4',
          'video/avi',
          'video/mov',
          'audio/mp3',
          'audio/wav',
          'audio/m4a'
        ];
      default:
        return undefined; // Accept all file types
    }
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text size="xl" fw={600}>Ancillary Documents</Text>
            <Text size="sm" c="dimmed">
              Supporting materials, presentations, and additional resources
            </Text>
          </div>
          <Badge color="teal" variant="light" size="lg">
            Ancillary Library
          </Badge>
        </Group>

        {/* Quick Filters */}
        <Card withBorder p="md">
          <Stack gap="sm">
            <Text fw={500}>Quick Filters</Text>
            <Group>
              <TextInput
                placeholder="Search documents..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Category"
                data={categories}
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value || 'all')}
                w={200}
              />
              <Button
                variant="outline"
                leftSection={<IconFolderPlus size={16} />}
                onClick={() => {
                  // Create new folder functionality
                  console.log('Create folder');
                }}
              >
                New Folder
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* File Type Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            {Object.entries(fileTypes).map(([key, type]) => {
              const IconComponent = type.icon;
              return (
                <Tabs.Tab 
                  key={key}
                  value={key} 
                  leftSection={<IconComponent size={16} />}
                  color={type.color}
                >
                  {type.label}
                </Tabs.Tab>
              );
            })}
          </Tabs.List>

          {Object.entries(fileTypes).map(([key, type]) => (
            <Tabs.Panel key={key} value={key}>
              <Stack gap="md">
                {/* Tab Description */}
                <Card withBorder variant="light" p="sm">
                  <Text size="sm" c="dimmed">
                    {type.description}
                  </Text>
                </Card>

                {/* Document Manager for this file type */}
                <DocumentManager
                  initiativeId={initiativeId}
                  libraryType="ancillary"
                  title={`${type.label} - Ancillary Library`}
                  category={getCurrentCategory()}
                  showUpload={true}
                />
              </Stack>
            </Tabs.Panel>
          ))}
        </Tabs>

        {/* Category-specific Information */}
        {selectedCategory !== 'all' && (
          <Card withBorder p="md" style={{ marginTop: '1rem' }}>
            <Stack gap="xs">
              <Text fw={500}>
                {categories.find(c => c.value === selectedCategory)?.label} Guidelines
              </Text>
              <Text size="sm" c="dimmed">
                {getCategoryGuidelines(selectedCategory)}
              </Text>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
};

const getCategoryGuidelines = (category: string): string => {
  const guidelines: Record<string, string> = {
    technical: 'Include technical specifications, API documentation, system diagrams, and implementation guides.',
    training: 'Upload training materials, user guides, tutorials, and educational resources.',
    presentations: 'Store presentation slides, demo materials, and stakeholder communication decks.',
    reports: 'Include analysis reports, status updates, metrics dashboards, and assessment documents.',
    media: 'Upload screenshots, videos, promotional materials, and multimedia assets.',
    correspondence: 'Store email chains, meeting notes, decision records, and communication logs.',
    research: 'Include research papers, market analysis, competitive studies, and reference materials.',
    other: 'Any supporting documents that don\'t fit into the above categories.'
  };
  
  return guidelines[category] || 'Supporting documents and materials related to this initiative.';
};

export default AncillaryDocuments;