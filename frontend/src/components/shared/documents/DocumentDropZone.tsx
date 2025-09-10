import React, { useState, useCallback } from 'react';
import { 
  Stack, 
  Text, 
  Group, 
  Progress, 
  Button, 
  Alert,
  Badge,
  ActionIcon,
  Card,
  Center
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { 
  IconUpload, 
  IconX, 
  IconFileText, 
  IconCheck,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash
} from '@tabler/icons-react';
import type { DocumentDropZoneProps, UploadProgress } from '../../../types/document';

const DocumentDropZone: React.FC<DocumentDropZoneProps> = ({
  onDrop,
  accept,
  maxSize = 50 * 1024 * 1024, // 50MB default
  multiple = true,
  disabled = false,
  libraryType,
  category,
  children
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  const handleDrop = useCallback((files: File[]) => {
    setRejectedFiles([]);
    
    // Create upload progress entries
    const newUploads: UploadProgress[] = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      filename: file.name,
      progress: 0,
      status: 'uploading'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Simulate upload progress (replace with actual upload logic)
    newUploads.forEach((upload, index) => {
      simulateUpload(upload.id, files[index]);
    });

    // Call the onDrop callback with the files
    onDrop(files);
  }, [onDrop]);

  const handleReject = useCallback((files: any[]) => {
    const rejectedFileNames = files.map(file => 
      `${file.file.name}: ${file.errors.map((e: any) => e.message).join(', ')}`
    );
    setRejectedFiles(rejectedFileNames);
  }, []);

  const simulateUpload = (uploadId: string, file: File) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploads(prev => 
          prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, progress: 100, status: 'success' }
              : upload
          )
        );
      } else {
        setUploads(prev => 
          prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, progress }
              : upload
          )
        );
      }
    }, 200);
  };

  const pauseUpload = (uploadId: string) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'paused' }
          : upload
      )
    );
  };

  const resumeUpload = (uploadId: string) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'uploading' }
          : upload
      )
    );
  };

  const cancelUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'success'));
  };

  const getAcceptedFileTypes = () => {
    if (accept) {
      return accept.join(', ');
    }
    
    switch (libraryType) {
      case 'admin':
        return 'PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX';
      case 'core':
        return 'PDF, DOC, DOCX';
      case 'ancillary':
        return 'PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, TXT';
      default:
        return 'All supported formats';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'paused': return 'yellow';
      default: return 'blue';
    }
  };

  return (
    <Stack gap="md">
      <Dropzone
        onDrop={handleDrop}
        onReject={handleReject}
        maxSize={maxSize}
        multiple={multiple}
        disabled={disabled}
        accept={accept ? accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) : undefined}
      >
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              style={{ 
                width: '52px', 
                height: '52px',
                color: 'var(--mantine-color-blue-6)' 
              }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          
          <Dropzone.Reject>
            <IconX
              style={{ 
                width: '52px', 
                height: '52px',
                color: 'var(--mantine-color-red-6)' 
              }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          
          <Dropzone.Idle>
            <IconFileText
              style={{ 
                width: '52px', 
                height: '52px',
                color: 'var(--mantine-color-gray-6)' 
              }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag documents here or click to select files
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Upload documents to the {libraryType} library
              {category && ` (${category})`}
            </Text>
            <Text size="xs" c="dimmed" mt={7}>
              Accepted formats: {getAcceptedFileTypes()}
            </Text>
            <Text size="xs" c="dimmed">
              Maximum file size: {formatFileSize(maxSize)}
            </Text>
          </div>
        </Group>

        {children}
      </Dropzone>

      {/* Rejected Files */}
      {rejectedFiles.length > 0 && (
        <Alert color="red" title="Some files were rejected">
          <Stack gap="xs">
            {rejectedFiles.map((error, index) => (
              <Text key={index} size="sm">{error}</Text>
            ))}
          </Stack>
        </Alert>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" fw={500}>Upload Progress</Text>
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={clearCompleted}
                  disabled={!uploads.some(u => u.status === 'success')}
                >
                  Clear Completed
                </Button>
              </Group>
            </Group>

            {uploads.map((upload) => (
              <Card key={upload.id} withBorder radius="sm">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Text size="sm" fw={500} truncate style={{ maxWidth: '300px' }}>
                        {upload.filename}
                      </Text>
                      <Badge 
                        size="sm" 
                        color={getProgressColor(upload.status)}
                        variant="light"
                      >
                        {upload.status}
                      </Badge>
                    </Group>

                    <Group gap="xs">
                      {upload.status === 'uploading' && (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => pauseUpload(upload.id)}
                        >
                          <IconPlayerPause size={14} />
                        </ActionIcon>
                      )}
                      
                      {upload.status === 'paused' && (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => resumeUpload(upload.id)}
                        >
                          <IconPlayerPlay size={14} />
                        </ActionIcon>
                      )}

                      {upload.status === 'success' && (
                        <ActionIcon size="sm" variant="subtle" color="green">
                          <IconCheck size={14} />
                        </ActionIcon>
                      )}

                      {upload.status !== 'success' && (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => cancelUpload(upload.id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>

                  {upload.status !== 'success' && (
                    <Progress
                      value={upload.progress}
                      color={getProgressColor(upload.status)}
                      size="sm"
                      radius="sm"
                    />
                  )}

                  {upload.error && (
                    <Text size="xs" c="red">
                      {upload.error}
                    </Text>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
};

export default DocumentDropZone;