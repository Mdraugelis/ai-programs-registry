export { default as DocumentPreviewModal } from './DocumentPreviewModal';
export { default as DocumentDropZone } from './DocumentDropZone';
export { default as DocumentActionsMenu } from './DocumentActionsMenu';

// Re-export types for convenience
export type {
  Document,
  DocumentTemplate,
  DocumentRequirement,
  ComplianceStatus,
  DocumentPreviewProps,
  DocumentDropZoneProps,
  DocumentActionsMenuProps,
  UploadProgress,
  DocumentUploadRequest
} from '../../../types/document';