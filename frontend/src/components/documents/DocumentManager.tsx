import React, { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Text,
  Group,
  Button,
  Card,
  Table,
  Badge,
  TextInput,
  Select,
  Modal,
  Alert,
  Loader,
  Center,
  Pagination
} from '@mantine/core';
import { 
  IconPlus, 
  IconSearch, 
  IconFilter,
  IconFileText,
  IconUpload,
  IconAlertCircle
} from '@tabler/icons-react';
import { 
  DocumentPreviewModal, 
  DocumentDropZone, 
  DocumentActionsMenu 
} from '../shared/documents';
import { Document, DocumentUploadRequest } from '../../types/document';

interface DocumentManagerProps {
  initiativeId?: number;
  libraryType?: 'admin' | 'core' | 'ancillary';
  showUpload?: boolean;
  title?: string;
  category?: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  initiativeId,
  libraryType,
  showUpload = true,
  title = 'Document Library',
  category
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchDocuments();
  }, [currentPage, searchQuery, statusFilter, categoryFilter, libraryType, initiativeId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (libraryType) params.append('library_type', libraryType);
      if (initiativeId) params.append('initiative_id', initiativeId.toString());

      const response = await fetch(`http://localhost:8000/documents?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const data = await response.json();
      setDocuments(data.documents || data);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        if (initiativeId) {
          formData.append('initiative_id', initiativeId.toString());
        }
        if (libraryType) {
          formData.append('library_type', libraryType);
        }
        if (category) {
          formData.append('category', category);
        }

        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
      }

      await fetchDocuments();
      setUploadModalOpen(false);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`http://localhost:8000/documents/${document.id}`);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handlePreview = (document: Document) => {
    setPreviewDocument(document);
  };

  const handleEdit = (document: Document) => {
    console.log('Edit document:', document.filename);
  };

  const handleDelete = async (document: Document) => {
    try {
      const response = await fetch(`http://localhost:8000/documents/${document.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      await fetchDocuments();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleArchive = async (document: Document) => {
    try {
      const response = await fetch(`http://localhost:8000/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      });

      if (!response.ok) {
        throw new Error(`Archive failed: ${response.statusText}`);
      }

      await fetchDocuments();
    } catch (err) {
      console.error('Archive error:', err);
      setError(err instanceof Error ? err.message : 'Archive failed');
    }
  };

  const handleRestore = async (document: Document) => {
    try {
      const response = await fetch(`http://localhost:8000/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });

      if (!response.ok) {
        throw new Error(`Restore failed: ${response.statusText}`);
      }

      await fetchDocuments();
    } catch (err) {
      console.error('Restore error:', err);
      setError(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'archived': return 'yellow';
      case 'deleted': return 'red';
      default: return 'gray';
    }
  };

  const getLibraryTypeColor = (libraryType: string) => {
    switch (libraryType) {
      case 'admin': return 'violet';
      case 'core': return 'blue';
      case 'ancillary': return 'teal';
      default: return 'gray';
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Center h={400}>
        <Stack align="center" gap="sm">
          <Loader size="md" />
          <Text size="sm" c="dimmed">Loading documents...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text size="xl" fw={600}>{title}</Text>
            {libraryType && (
              <Text size="sm" c="dimmed">
                {libraryType.charAt(0).toUpperCase() + libraryType.slice(1)} Library
                {category && ` - ${category}`}
              </Text>
            )}
          </div>
          {showUpload && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setUploadModalOpen(true)}
            >
              Upload Documents
            </Button>
          )}
        </Group>

        {/* Filters */}
        <Card withBorder p="md">
          <Stack gap="sm">
            <Group>
              <TextInput
                placeholder="Search documents..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Status"
                data={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                  { value: 'deleted', label: 'Deleted' }
                ]}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value || 'all')}
                w={120}
              />
              <Select
                placeholder="Category"
                data={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'governance', label: 'Governance' },
                  { value: 'technical', label: 'Technical' },
                  { value: 'compliance', label: 'Compliance' },
                  { value: 'training', label: 'Training' }
                ]}
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value || 'all')}
                w={140}
              />
            </Group>
          </Stack>
        </Card>

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

        {/* Documents Table */}
        {documents.length === 0 ? (
          <Card withBorder p="xl">
            <Center>
              <Stack align="center" gap="sm">
                <IconFileText size={48} color="gray" />
                <Text size="lg" c="dimmed">No documents found</Text>
                <Text size="sm" c="dimmed">
                  {showUpload ? 'Upload your first document to get started' : 'No documents match your criteria'}
                </Text>
              </Stack>
            </Center>
          </Card>
        ) : (
          <Card withBorder>
            <Table.ScrollContainer minWidth={800}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Document</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Size</Table.Th>
                    <Table.Th>Uploaded</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {documents.map((document) => (
                    <Table.Tr key={document.id}>
                      <Table.Td>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} truncate style={{ maxWidth: '250px' }}>
                            {document.filename}
                          </Text>
                          {document.description && (
                            <Text size="xs" c="dimmed" truncate style={{ maxWidth: '250px' }}>
                              {document.description}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Badge color={getLibraryTypeColor(document.library_type)} variant="light" size="sm">
                            {document.library_type.toUpperCase()}
                          </Badge>
                          {document.is_required && (
                            <Badge color="red" variant="outline" size="sm">
                              Required
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(document.status)} variant="light">
                          {document.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatFileSize(document.file_size)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(document.uploaded_at).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <DocumentActionsMenu
                          document={document}
                          onDownload={handleDownload}
                          onPreview={handlePreview}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onArchive={handleArchive}
                          onRestore={handleRestore}
                          userRole="admin"
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  size="sm"
                />
              </Group>
            )}
          </Card>
        )}

        {/* Upload Modal */}
        <Modal
          opened={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title={
            <Group gap="sm">
              <IconUpload size={20} />
              <Text size="lg" fw={600}>Upload Documents</Text>
            </Group>
          }
          size="lg"
          centered
        >
          <DocumentDropZone
            onDrop={handleFileUpload}
            libraryType={libraryType || 'ancillary'}
            category={category}
          />
        </Modal>

        {/* Preview Modal */}
        {previewDocument && (
          <DocumentPreviewModal
            document={previewDocument}
            isOpen={!!previewDocument}
            onClose={() => setPreviewDocument(null)}
          />
        )}
      </Stack>
    </Container>
  );
};

export default DocumentManager;