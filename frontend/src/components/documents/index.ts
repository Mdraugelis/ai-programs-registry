export { default as DocumentManager } from './DocumentManager';
export { default as AdminLibrary } from './AdminLibrary';
export { default as CoreDocuments } from './CoreDocuments';
export { default as AncillaryDocuments } from './AncillaryDocuments';
export { default as ComplianceTracker } from './ComplianceTracker';

// Re-export shared components for convenience
export {
  DocumentPreviewModal,
  DocumentDropZone,
  DocumentActionsMenu
} from '../shared/documents';