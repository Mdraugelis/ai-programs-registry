import React, { useState } from 'react';
import { 
  Menu, 
  ActionIcon, 
  Modal, 
  Text, 
  Button, 
  Group, 
  Stack,
  Alert
} from '@mantine/core';
import { 
  IconDots, 
  IconDownload, 
  IconEye, 
  IconEdit, 
  IconTrash, 
  IconArchive,
  IconRestore,
  IconLink,
  IconHistory,
  IconAlertTriangle
} from '@tabler/icons-react';
import type { DocumentActionsMenuProps } from '../../../types/document';

const DocumentActionsMenu: React.FC<DocumentActionsMenuProps> = ({
  document: currentDocument,
  onDownload,
  onPreview,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  userRole = 'contributor'
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const canEdit = () => {
    if (userRole === 'admin') return true;
    if (userRole === 'reviewer' && currentDocument.library_type !== 'admin') return true;
    if (userRole === 'contributor' && currentDocument.library_type === 'ancillary') return true;
    return false;
  };

  const canDelete = () => {
    if (userRole === 'admin') return true;
    if (userRole === 'reviewer' && currentDocument.library_type !== 'admin') return true;
    return false;
  };

  const canArchive = () => {
    return canDelete() && currentDocument.status === 'active';
  };

  const canRestore = () => {
    return canDelete() && currentDocument.status === 'archived';
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(currentDocument);
    } else {
      // Default download behavior
      const downloadUrl = `/api/documents/${currentDocument.id}`;
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = currentDocument.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(currentDocument);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(currentDocument);
    }
  };

  const handleCopyLink = () => {
    const documentUrl = `${window.location.origin}/api/documents/${currentDocument.id}`;
    navigator.clipboard.writeText(documentUrl);
    // You might want to show a notification here
  };

  const handleViewHistory = () => {
    // Implement version history viewing
    console.log('View history for document:', currentDocument.id);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(currentDocument);
    }
    setDeleteConfirmOpen(false);
  };

  const handleArchiveConfirm = () => {
    if (onArchive) {
      onArchive(currentDocument);
    }
    setArchiveConfirmOpen(false);
  };

  const handleRestore = () => {
    if (onRestore) {
      onRestore(currentDocument);
    }
  };

  return (
    <>
      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" size="sm">
            <IconDots size={16} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Document Actions</Menu.Label>
          
          <Menu.Item
            leftSection={<IconEye size={14} />}
            onClick={handlePreview}
            disabled={!onPreview}
          >
            Preview
          </Menu.Item>

          <Menu.Item
            leftSection={<IconDownload size={14} />}
            onClick={handleDownload}
          >
            Download
          </Menu.Item>

          <Menu.Item
            leftSection={<IconLink size={14} />}
            onClick={handleCopyLink}
          >
            Copy Link
          </Menu.Item>

          <Menu.Divider />

          {canEdit() && (
            <Menu.Item
              leftSection={<IconEdit size={14} />}
              onClick={handleEdit}
              disabled={!onEdit}
            >
              Edit Details
            </Menu.Item>
          )}

          <Menu.Item
            leftSection={<IconHistory size={14} />}
            onClick={handleViewHistory}
          >
            Version History
          </Menu.Item>

          {canArchive() && (
            <>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconArchive size={14} />}
                onClick={() => setArchiveConfirmOpen(true)}
                color="yellow"
              >
                Archive
              </Menu.Item>
            </>
          )}

          {canRestore() && (
            <>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconRestore size={14} />}
                onClick={handleRestore}
                color="blue"
              >
                Restore
              </Menu.Item>
            </>
          )}

          {canDelete() && currentDocument.status !== 'deleted' && (
            <>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                onClick={() => setDeleteConfirmOpen(true)}
                color="red"
              >
                Delete
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={
          <Group gap="sm">
            <IconAlertTriangle size={20} color="red" />
            <Text size="lg" fw={600}>Confirm Delete</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Alert color="red" variant="light">
            <Text size="sm">
              Are you sure you want to delete this document? This action cannot be undone.
            </Text>
          </Alert>

          <Stack gap="xs">
            <Text size="sm" fw={500}>Document Details:</Text>
            <Text size="sm" c="dimmed">Name: {currentDocument.filename}</Text>
            <Text size="sm" c="dimmed">Type: {currentDocument.library_type}</Text>
            {currentDocument.category && (
              <Text size="sm" c="dimmed">Category: {currentDocument.category}</Text>
            )}
          </Stack>

          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteConfirm}
            >
              Delete Document
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal
        opened={archiveConfirmOpen}
        onClose={() => setArchiveConfirmOpen(false)}
        title={
          <Group gap="sm">
            <IconArchive size={20} color="orange" />
            <Text size="lg" fw={600}>Confirm Archive</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Alert color="yellow" variant="light">
            <Text size="sm">
              Are you sure you want to archive this document? Archived documents 
              will not be visible in normal document lists but can be restored later.
            </Text>
          </Alert>

          <Stack gap="xs">
            <Text size="sm" fw={500}>Document Details:</Text>
            <Text size="sm" c="dimmed">Name: {currentDocument.filename}</Text>
            <Text size="sm" c="dimmed">Type: {currentDocument.library_type}</Text>
            {currentDocument.category && (
              <Text size="sm" c="dimmed">Category: {currentDocument.category}</Text>
            )}
          </Stack>

          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={() => setArchiveConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="yellow"
              onClick={handleArchiveConfirm}
            >
              Archive Document
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default DocumentActionsMenu;
