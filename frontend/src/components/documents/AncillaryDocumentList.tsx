import React, { useState, useEffect } from 'react';
import {
  Table,
  Stack,
  TextInput,
  Group,
  Badge,
  ActionIcon,
  Text,
  Card,
  Select,
  Button,
  Menu,
  Alert,
  LoadingOverlay,
  Tooltip,
  Chip,
  ChipGroup,
  Pagination,
  Center
} from '@mantine/core';
import {
  IconSearch,
  IconDownload,
  IconTrash,
  IconDots,
  IconEye,
  IconEdit,
  IconFilter,
  IconRefresh,
  IconFileText,
  IconPhoto,
  IconVideo,
  IconFile
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ancillaryDocumentsAPI, documentsAPI } from '../../services/api';
import type { AncillaryDocument, AncillaryDocumentListProps } from '../../types/document';


const ITEMS_PER_PAGE = 10;

const AncillaryDocumentList: React.FC<AncillaryDocumentListProps> = ({
  initiativeId,
  onDocumentSelect,
  onDocumentUpdate,
  onDocumentDelete,
  showActions = true,
  compact = false
}) => {
  const [documents, setDocuments] = useState<AncillaryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'research', label: 'Research & Reference' },
    { value: 'technical', label: 'Technical Documentation' },
    { value: 'training', label: 'Training Materials' },
    { value: 'presentations', label: 'Presentations' },
    { value: 'reports', label: 'Reports & Analysis' },
    { value: 'media', label: 'Media & Assets' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchDocuments();
  }, [initiativeId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await ancillaryDocumentsAPI.getByInitiative(initiativeId);
      setDocuments(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load ancillary documents',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: AncillaryDocument) => {
    try {
      const { blob, filename } = await documentsAPI.download(doc.id);
      
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename || doc.filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      notifications.show({
        title: 'Download Failed',
        message: 'Could not download the document',
        color: 'red'
      });
    }
  };

  const handleDelete = async (doc: AncillaryDocument) => {
    if (window.confirm(`Are you sure you want to delete "${doc.filename}"?`)) {
      try {
        await ancillaryDocumentsAPI.delete(doc.id);
        
        setDocuments(documents.filter(existing => existing.id !== doc.id));
        onDocumentDelete?.(doc.id);
        
        notifications.show({
          title: 'Success',
          message: 'Document deleted successfully',
          color: 'green'
        });
      } catch (error) {
        notifications.show({
          title: 'Delete Failed',
          message: 'Could not delete the document',
          color: 'red'
        });
      }
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <IconPhoto size={16} />;
    }
    if (['mp4', 'avi', 'mov', 'mp3', 'wav'].includes(extension || '')) {
      return <IconVideo size={16} />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
      return <IconFileText size={16} />;
    }
    return <IconFile size={16} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAllTags = (): string[] => {
    const tagSet = new Set<string>();
    documents.forEach(doc => {
      if (doc.tags) {
        doc.tags.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) tagSet.add(trimmed);
        });
      }
    });
    return Array.from(tagSet).sort();
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.filename.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.document_type?.toLowerCase().includes(query) ||
        doc.tags?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === selectedCategory);
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(doc => {
        const docTags = doc.tags?.split(',').map(t => t.trim().toLowerCase()) || [];
        return selectedTags.some(tag => docTags.includes(tag.toLowerCase()));
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'date':
          comparison = new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
          break;
        case 'size':
          comparison = a.file_size - b.file_size;
          break;
        case 'type':
          comparison = (a.document_type || '').localeCompare(b.document_type || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredDocuments = filterDocuments();
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading) {
    return (
      <Card withBorder p="md" style={{ position: 'relative', minHeight: '200px' }}>
        <LoadingOverlay visible />
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {/* Header and Filters */}
      {!compact && (
        <Card withBorder p="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <div>
                <Text size="lg" fw={600}>Ancillary Documents</Text>
                <Text size="sm" c="dimmed">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                </Text>
              </div>
              <Group>
                <Tooltip label="Refresh documents">
                  <ActionIcon variant="subtle" onClick={fetchDocuments}>
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            {/* Search and Filter Controls */}
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
              <Menu shadow="md" width={300}>
                <Menu.Target>
                  <Button 
                    variant="outline" 
                    leftSection={<IconFilter size={16} />}
                    rightSection={selectedTags.length > 0 && (
                      <Badge size="xs" color="blue">{selectedTags.length}</Badge>
                    )}
                  >
                    Filter
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Filter by Tags</Menu.Label>
                  <ChipGroup 
                    multiple 
                    value={selectedTags} 
                    onChange={setSelectedTags}
                  >
                    <Stack gap="xs" p="sm">
                      {getAllTags().map(tag => (
                        <Chip key={tag} value={tag} size="sm">
                          {tag}
                        </Chip>
                      ))}
                    </Stack>
                  </ChipGroup>
                  <Menu.Divider />
                  <Menu.Item onClick={() => setSelectedTags([])}>
                    Clear Filters
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Stack>
        </Card>
      )}

      {/* Documents Table */}
      <Card withBorder p="md">
        {filteredDocuments.length === 0 ? (
          <Center p="xl">
            <Stack align="center" gap="sm">
              <IconFileText size={48} color="gray" />
              <Text c="dimmed">No ancillary documents found</Text>
              {searchQuery || selectedCategory !== 'all' || selectedTags.length > 0 ? (
                <Text size="sm" c="dimmed">Try adjusting your filters</Text>
              ) : (
                <Text size="sm" c="dimmed">Upload supporting documents to get started</Text>
              )}
            </Stack>
          </Center>
        ) : (
          <Stack gap="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Button 
                      variant="subtle" 
                      size="xs" 
                      onClick={() => {
                        setSortBy('name');
                        setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </Table.Th>
                  <Table.Th>
                    <Button 
                      variant="subtle" 
                      size="xs" 
                      onClick={() => {
                        setSortBy('type');
                        setSortOrder(sortBy === 'type' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </Table.Th>
                  <Table.Th>
                    <Button 
                      variant="subtle" 
                      size="xs" 
                      onClick={() => {
                        setSortBy('size');
                        setSortOrder(sortBy === 'size' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </Table.Th>
                  <Table.Th>
                    <Button 
                      variant="subtle" 
                      size="xs" 
                      onClick={() => {
                        setSortBy('date');
                        setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Upload Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </Table.Th>
                  <Table.Th>Uploader</Table.Th>
                  {showActions && <Table.Th>Actions</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedDocuments.map((document) => (
                  <Table.Tr key={document.id}>
                    <Table.Td>
                      <Group gap="sm">
                        {getFileIcon(document.filename)}
                        <div style={{ maxWidth: '200px' }}>
                          <Text size="sm" fw={500} truncate>
                            {document.filename}
                          </Text>
                          {document.description && (
                            <Text size="xs" c="dimmed" truncate>
                              {document.description}
                            </Text>
                          )}
                          {document.tags && (
                            <Group gap="2px" mt="2px">
                              {document.tags.split(',').slice(0, 2).map((tag, i) => (
                                <Badge key={i} size="xs" variant="light">
                                  {tag.trim()}
                                </Badge>
                              ))}
                              {document.tags.split(',').length > 2 && (
                                <Badge size="xs" variant="light" c="dimmed">
                                  +{document.tags.split(',').length - 2}
                                </Badge>
                              )}
                            </Group>
                          )}
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">
                        {document.document_type || 'other'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatFileSize(document.file_size)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(document.uploaded_at)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{document.uploaded_by}</Text>
                    </Table.Td>
                    {showActions && (
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Download">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              onClick={() => handleDownload(document)}
                            >
                              <IconDownload size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="View Details">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              onClick={() => onDocumentSelect?.(document)}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Menu shadow="md" width={120}>
                            <Menu.Target>
                              <ActionIcon size="sm" variant="subtle">
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item 
                                leftSection={<IconEdit size={14} />}
                                onClick={() => onDocumentUpdate?.(document)}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item 
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => handleDelete(document)}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <Center>
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  size="sm"
                />
              </Center>
            )}
          </Stack>
        )}
      </Card>
    </Stack>
  );
};

export default AncillaryDocumentList;
