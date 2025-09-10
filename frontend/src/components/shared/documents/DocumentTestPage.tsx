import React, { useState } from 'react';
import { Container, Stack, Button, Group, Text, Card } from '@mantine/core';
import { DocumentPreviewModal } from './index';
import { DocumentDropZone } from './index';
import { DocumentActionsMenu } from './index';
import type { Document } from '../../../types/document';

const mockDocument: Document = {
  id: 1,
  filename: 'sample-document.pdf',
  file_path: '/uploads/sample-document.pdf',
  file_size: 1024000,
  uploaded_by: 'John Doe',
  uploaded_at: '2024-01-15T10:30:00Z',
  document_type: 'policy',
  library_type: 'core',
  category: 'governance',
  is_template: false,
  is_required: true,
  version: 1,
  status: 'active',
  description: 'Sample governance policy document for testing',
  tags: 'policy, governance, compliance'
};

const DocumentTestPage: React.FC = () => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileDrop = (files: File[]) => {
    console.log('Files dropped:', files);
  };

  const handleDownload = (document: Document) => {
    console.log('Download document:', document.filename);
  };

  const handlePreview = (document: Document) => {
    console.log('Preview document:', document.filename);
    setPreviewOpen(true);
  };

  const handleEdit = (document: Document) => {
    console.log('Edit document:', document.filename);
  };

  const handleDelete = (document: Document) => {
    console.log('Delete document:', document.filename);
  };

  const handleArchive = (document: Document) => {
    console.log('Archive document:', document.filename);
  };

  const handleRestore = (document: Document) => {
    console.log('Restore document:', document.filename);
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Text size="xl" fw={600}>Document Components Test Page</Text>

        {/* Document Drop Zone Test */}
        <Card withBorder p="md">
          <Stack gap="md">
            <Text size="lg" fw={500}>Document Drop Zone</Text>
            <DocumentDropZone
              onDrop={handleFileDrop}
              libraryType="core"
              category="governance"
              accept={['application/pdf', 'application/msword']}
            />
          </Stack>
        </Card>

        {/* Document Actions Menu Test */}
        <Card withBorder p="md">
          <Stack gap="md">
            <Text size="lg" fw={500}>Document Actions Menu</Text>
            <Group>
              <Text>Sample Document Actions:</Text>
              <DocumentActionsMenu
                document={mockDocument}
                onDownload={handleDownload}
                onPreview={handlePreview}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onRestore={handleRestore}
                userRole="admin"
              />
            </Group>
          </Stack>
        </Card>

        {/* Document Preview Test */}
        <Card withBorder p="md">
          <Stack gap="md">
            <Text size="lg" fw={500}>Document Preview Modal</Text>
            <Button onClick={() => setPreviewOpen(true)}>
              Open Preview Modal
            </Button>
          </Stack>
        </Card>

        <DocumentPreviewModal
          document={mockDocument}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      </Stack>
    </Container>
  );
};

export default DocumentTestPage;