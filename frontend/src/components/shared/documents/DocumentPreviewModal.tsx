import React, { useState } from 'react';
import { Modal, Paper, Text, Group, Button, Stack, Badge, ScrollArea, Center, Loader, Alert } from '@mantine/core';
import { IconDownload, IconExternalLink, IconFileText, IconAlertTriangle } from '@tabler/icons-react';
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf';
import type { Document as DocumentType, DocumentPreviewProps } from '../../../types/document';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const DocumentPreviewModal: React.FC<DocumentPreviewProps> = ({
  document,
  isOpen,
  onClose
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setLoading(false);
    setError('Failed to load PDF document. The file might be corrupted or unsupported.');
  };

  const handleDownload = () => {
    // Create download URL for the document
    const downloadUrl = `/api/documents/${document.id}`;
    const link = window.document.createElement('a');
    link.href = downloadUrl;
    link.download = document.filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleOpenExternal = () => {
    // Open document in new tab
    const downloadUrl = `/api/documents/${document.id}`;
    window.open(downloadUrl, '_blank');
  };

  const getFileType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return extension;
  };

  const isPDF = (filename: string): boolean => {
    return getFileType(filename) === 'pdf';
  };

  const isImage = (filename: string): boolean => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    return imageTypes.includes(getFileType(filename));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'archived': return 'gray';
      case 'deleted': return 'red';
      default: return 'blue';
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

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconFileText size={20} />
          <Text size="lg" fw={600} truncate style={{ maxWidth: '400px' }}>
            {document.filename}
          </Text>
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="md">
        {/* Document Metadata */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Group gap="sm">
                <Badge color={getLibraryTypeColor(document.library_type)} variant="light">
                  {document.library_type.toUpperCase()}
                </Badge>
                <Badge color={getStatusColor(document.status)} variant="outline">
                  {document.status}
                </Badge>
                {document.is_required && (
                  <Badge color="red" variant="light">
                    Required
                  </Badge>
                )}
                {document.is_template && (
                  <Badge color="yellow" variant="light">
                    Template
                  </Badge>
                )}
              </Group>
              <Group gap="sm">
                <Button
                  variant="subtle"
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownload}
                  size="sm"
                >
                  Download
                </Button>
                <Button
                  variant="subtle"
                  leftSection={<IconExternalLink size={16} />}
                  onClick={handleOpenExternal}
                  size="sm"
                >
                  Open
                </Button>
              </Group>
            </Group>

            <Group gap="xl">
              {document.file_size && (
                <div>
                  <Text size="xs" c="dimmed">File Size</Text>
                  <Text size="sm">{formatFileSize(document.file_size)}</Text>
                </div>
              )}
              <div>
                <Text size="xs" c="dimmed">Version</Text>
                <Text size="sm">v{document.version}</Text>
              </div>
              {document.uploaded_by && (
                <div>
                  <Text size="xs" c="dimmed">Uploaded By</Text>
                  <Text size="sm">{document.uploaded_by}</Text>
                </div>
              )}
              <div>
                <Text size="xs" c="dimmed">Uploaded</Text>
                <Text size="sm">
                  {new Date(document.uploaded_at).toLocaleDateString()}
                </Text>
              </div>
            </Group>

            {document.description && (
              <div>
                <Text size="xs" c="dimmed">Description</Text>
                <Text size="sm">{document.description}</Text>
              </div>
            )}

            {document.tags && (
              <div>
                <Text size="xs" c="dimmed">Tags</Text>
                <Group gap="xs">
                  {document.tags.split(',').map((tag, index) => (
                    <Badge key={index} size="sm" variant="dot">
                      {tag.trim()}
                    </Badge>
                  ))}
                </Group>
              </div>
            )}
          </Stack>
        </Paper>

        {/* Document Preview */}
        <Paper p="md" withBorder style={{ minHeight: '400px' }}>
          <Stack gap="md">
            <Text size="sm" fw={500}>Document Preview</Text>
            
            {isPDF(document.filename) ? (
              <div>
                {loading && (
                  <Center h={300}>
                    <Stack align="center" gap="sm">
                      <Loader size="md" />
                      <Text size="sm" c="dimmed">Loading PDF...</Text>
                    </Stack>
                  </Center>
                )}
                
                {error ? (
                  <Alert
                    icon={<IconAlertTriangle size={16} />}
                    title="Preview Error"
                    color="red"
                  >
                    {error}
                  </Alert>
                ) : (
                  <Stack gap="sm">
                    <ScrollArea style={{ height: '400px' }}>
                      <PDFDocument
                        file={`/api/documents/${document.id}`}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={null}
                      >
                        <Page 
                          pageNumber={pageNumber} 
                          width={Math.min(window.innerWidth * 0.6, 600)}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </PDFDocument>
                    </ScrollArea>
                    
                    {numPages > 0 && (
                      <Group justify="center" gap="sm">
                        <Button
                          variant="subtle"
                          size="sm"
                          disabled={pageNumber <= 1}
                          onClick={() => setPageNumber(pageNumber - 1)}
                        >
                          Previous
                        </Button>
                        <Text size="sm">
                          Page {pageNumber} of {numPages}
                        </Text>
                        <Button
                          variant="subtle"
                          size="sm"
                          disabled={pageNumber >= numPages}
                          onClick={() => setPageNumber(pageNumber + 1)}
                        >
                          Next
                        </Button>
                      </Group>
                    )}
                  </Stack>
                )}
              </div>
            ) : isImage(document.filename) ? (
              <Center>
                <img
                  src={`/api/documents/${document.id}`}
                  alt={document.filename}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    setError('Failed to load image preview');
                  }}
                />
              </Center>
            ) : (
              <Alert
                icon={<IconFileText size={16} />}
                title="Preview Not Available"
                color="blue"
              >
                Preview is not available for this file type ({getFileType(document.filename).toUpperCase()}).
                You can download the file to view it.
              </Alert>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Modal>
  );
};

export default DocumentPreviewModal;