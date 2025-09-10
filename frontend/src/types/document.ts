export interface Document {
  id: number;
  initiative_id?: number;
  filename: string;
  file_path: string;
  file_size?: number;
  uploaded_by?: string;
  uploaded_at: string;
  document_type?: string;
  library_type: 'admin' | 'core' | 'ancillary';
  category?: string;
  is_template: boolean;
  is_required: boolean;
  template_id?: number;
  version: number;
  status: 'active' | 'archived' | 'deleted';
  description?: string;
  tags?: string;
}

export interface DocumentTemplate {
  id: number;
  name: string;
  description?: string;
  category?: string;
  file_path?: string;
  placeholders?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DocumentRequirement {
  id: number;
  name: string;
  description?: string;
  category?: string;
  stage?: string;
  is_mandatory: boolean;
  template_id?: number;
  created_at: string;
  has_template?: boolean;
  is_uploaded?: boolean;
}

export interface ComplianceStatus {
  initiative_id: number;
  total_required: number;
  completed: number;
  missing: string[];
  compliance_percentage: number;
  status: 'compliant' | 'mostly-compliant' | 'partially-compliant' | 'non-compliant';
}

export interface DocumentPreviewProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

export interface DocumentDropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string[];
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  libraryType: 'admin' | 'core' | 'ancillary';
  category?: string;
  children?: React.ReactNode;
}

export interface DocumentActionsMenuProps {
  document: Document;
  onDownload?: (document: Document) => void;
  onPreview?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onArchive?: (document: Document) => void;
  onRestore?: (document: Document) => void;
  userRole?: 'admin' | 'reviewer' | 'contributor';
}

export interface UploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'success' | 'error' | 'paused';
  error?: string;
}

export interface DocumentUploadRequest {
  initiative_id?: number;
  library_type: 'admin' | 'core' | 'ancillary';
  category?: string;
  document_type?: string;
  description?: string;
  tags?: string;
  is_required?: boolean;
}