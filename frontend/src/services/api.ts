import axios from 'axios';
import type { Initiative, User } from '../types/initiative';
import type { AncillaryDocument, Document, DocumentUploadRequest } from '../types/document';

// API base URL - matches the backend server
const API_BASE_URL = 'http://127.0.0.1:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Backend initiative interface (matches backend schema)
interface BackendInitiative {
  id: number;
  name: string;
  description?: string;
  department?: string;
  stage?: 'discovery' | 'pilot' | 'production' | 'retired';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  lead_name?: string;
  lead_email?: string;
  business_value?: string;
  technical_approach?: string;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'paused' | 'completed' | 'deleted';
  created_at: string;
  updated_at: string;
}

// Backend initiative create interface
interface BackendInitiativeCreate {
  name: string;
  description?: string;
  department?: string;
  stage?: 'discovery' | 'pilot' | 'production' | 'retired';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  lead_name?: string;
  lead_email?: string;
  executive_champion?: string;
  vendor_type?: string;
  vendors?: string;
  ai_components?: string;
  success_metrics?: string;
  equity_considerations?: string;
  benefits?: string;
  business_value?: string;
  technical_approach?: string;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'paused' | 'completed' | 'deleted';
}

// Map frontend initiative to backend format
const mapToBackendInitiative = (initiative: Omit<Initiative, 'id' | 'created_at' | 'updated_at'>): BackendInitiativeCreate => {
  return {
    name: initiative.title,
    description: initiative.background,
    department: initiative.department,
    stage: mapStageToBackend(initiative.stage),
    priority: mapPriorityFromRisk(initiative.risks),
    lead_name: initiative.program_owner,
    lead_email: initiative.created_by,
    executive_champion: initiative.executive_champion,
    vendor_type: initiative.vendor_type,
    vendors: initiative.vendors,
    ai_components: initiative.ai_components ? initiative.ai_components.join(',') : undefined,
    success_metrics: initiative.success_metrics,
    equity_considerations: initiative.equity_considerations,
    benefits: initiative.benefits,
    business_value: initiative.goal,
    technical_approach: `${initiative.approach_workflow || ''}\n\n${initiative.approach_technical || ''}`.trim(),
    start_date: undefined,
    end_date: undefined,
    status: 'active'
  };
};

// Map backend initiative to frontend format
const mapFromBackendInitiative = (backendInit: any): Initiative => {
  return {
    id: backendInit.id.toString(),
    title: backendInit.name,
    program_owner: backendInit.lead_name || '',
    executive_champion: backendInit.executive_champion || '',
    department: backendInit.department || '',
    vendor_type: backendInit.vendor_type,
    vendors: backendInit.vendors,
    background: backendInit.description,
    goal: backendInit.business_value,
    approach_workflow: backendInit.technical_approach?.split('\n\n')[0] || '',
    approach_technical: backendInit.technical_approach?.split('\n\n')[1] || backendInit.technical_approach || '',
    ai_components: backendInit.ai_components ? backendInit.ai_components.split(',') : [],
    success_metrics: backendInit.success_metrics,
    equity_considerations: backendInit.equity_considerations,
    risks: mapPriorityToRisk(backendInit.priority),
    benefits: backendInit.benefits,
    stage: mapStageFromBackend(backendInit.stage),
    created_at: backendInit.created_at,
    updated_at: backendInit.updated_at,
    created_by: backendInit.lead_email || ''
  };
};

// Helper functions for mapping different field formats
const mapStageToBackend = (stage: string): 'discovery' | 'pilot' | 'production' | 'retired' => {
  switch (stage) {
    case 'idea':
    case 'proposal':
      return 'discovery';
    case 'pilot':
      return 'pilot';
    case 'production':
      return 'production';
    case 'retired':
      return 'retired';
    default:
      return 'discovery';
  }
};

const mapStageFromBackend = (stage?: string): 'idea' | 'proposal' | 'pilot' | 'production' | 'retired' => {
  switch (stage) {
    case 'discovery':
      return 'idea';
    case 'pilot':
      return 'pilot';
    case 'production':
      return 'production';
    case 'retired':
      return 'retired';
    default:
      return 'idea';
  }
};

const mapPriorityFromRisk = (risks?: string): 'low' | 'medium' | 'high' | 'critical' => {
  if (!risks) return 'medium';
  const riskLower = risks.toLowerCase();
  if (riskLower.includes('high') || riskLower.includes('critical')) return 'high';
  if (riskLower.includes('medium')) return 'medium';
  if (riskLower.includes('low')) return 'low';
  return 'medium';
};

const mapPriorityToRisk = (priority?: string): string => {
  switch (priority) {
    case 'critical':
    case 'high':
      return 'High - requires careful monitoring and risk mitigation';
    case 'medium':
      return 'Medium - standard monitoring required';
    case 'low':
      return 'Low - minimal risk identified';
    default:
      return 'Medium - standard monitoring required';
  }
};

// Authentication API
export const authAPI = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token } = response.data;
    
    // Get user info
    api.defaults.headers.Authorization = `Bearer ${access_token}`;
    const userResponse = await api.get('/api/auth/me');
    
    const user: User = {
      id: userResponse.data.id.toString(),
      email: userResponse.data.email,
      name: userResponse.data.username,
      role: userResponse.data.role,
    };
    
    return { user, token: access_token };
  },
};

// Initiatives API
export const initiativesAPI = {
  async getAll(params?: {
    skip?: number;
    limit?: number;
    department?: string;
    stage?: string;
    priority?: string;
    status?: string;
  }): Promise<Initiative[]> {
    const response = await api.get('/api/initiatives', { params });
    return response.data.map(mapFromBackendInitiative);
  },

  async getById(id: string): Promise<Initiative> {
    const response = await api.get(`/api/initiatives/${id}`);
    return mapFromBackendInitiative(response.data);
  },

  async create(initiative: Omit<Initiative, 'id' | 'created_at' | 'updated_at'>): Promise<Initiative> {
    const backendData = mapToBackendInitiative(initiative);
    const response = await api.post('/api/initiatives', backendData);
    return mapFromBackendInitiative(response.data);
  },

  async update(id: string, updates: Partial<Initiative>): Promise<Initiative> {
    // Create a temporary initiative object for mapping
    const tempInitiative = { ...updates } as Omit<Initiative, 'id' | 'created_at' | 'updated_at'>;
    const backendData = mapToBackendInitiative(tempInitiative);
    
    // Only send defined fields
    const updateData: Partial<BackendInitiativeCreate> = {};
    Object.keys(backendData).forEach(key => {
      const value = backendData[key as keyof BackendInitiativeCreate];
      if (value !== undefined && value !== null && value !== '') {
        (updateData as any)[key] = value;
      }
    });
    
    const response = await api.put(`/api/initiatives/${id}`, updateData);
    return mapFromBackendInitiative(response.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/initiatives/${id}`);
  },
};

// Ancillary Documents API
export const ancillaryDocumentsAPI = {
  async getByInitiative(initiativeId: number): Promise<AncillaryDocument[]> {
    const response = await api.get(`/api/initiatives/${initiativeId}/documents`, {
      params: { library_type: 'ancillary' }
    });
    return response.data.map((doc: any) => ({
      ...doc,
      library_type: 'ancillary' as const
    }));
  },

  async upload(
    initiativeId: number,
    file: File,
    metadata: {
      description: string;
      tags: string;
      category: string;
    }
  ): Promise<AncillaryDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('initiative_id', initiativeId.toString());
    formData.append('document_type', metadata.category);
    formData.append('description', metadata.description);
    formData.append('tags', metadata.tags);

    const response = await api.post(
      `/api/initiatives/${initiativeId}/documents/ancillary`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      ...response.data,
      library_type: 'ancillary' as const,
      description: metadata.description,
      tags: metadata.tags
    };
  },

  async uploadMultiple(
    initiativeId: number,
    files: File[],
    metadata: {
      description: string;
      tags: string;
      category: string;
    }
  ): Promise<AncillaryDocument[]> {
    const uploadPromises = files.map(file => 
      this.upload(initiativeId, file, metadata)
    );
    return Promise.all(uploadPromises);
  },

  async download(documentId: number): Promise<Blob> {
    const response = await api.get(`/api/documents/${documentId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async delete(documentId: number): Promise<void> {
    await api.delete(`/api/documents/${documentId}`);
  },

  async update(
    documentId: number,
    updates: {
      description?: string;
      tags?: string;
      category?: string;
    }
  ): Promise<AncillaryDocument> {
    const response = await api.put(`/api/documents/${documentId}`, updates);
    return {
      ...response.data,
      library_type: 'ancillary' as const
    };
  },

  async getById(documentId: number): Promise<AncillaryDocument> {
    const response = await api.get(`/api/documents/${documentId}`);
    return {
      ...response.data,
      library_type: 'ancillary' as const
    };
  }
};

// General Documents API (for all document types)
export const documentsAPI = {
  async getByInitiative(initiativeId: number, libraryType?: 'admin' | 'core' | 'ancillary'): Promise<Document[]> {
    const response = await api.get(`/api/initiatives/${initiativeId}/documents`, {
      params: libraryType ? { library_type: libraryType } : {}
    });
    return response.data;
  },

  async download(documentId: number): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get(`/api/documents/${documentId}`, {
      responseType: 'blob'
    });
    
    // Try to extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `document-${documentId}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    return {
      blob: response.data,
      filename
    };
  },

  async delete(documentId: number): Promise<void> {
    await api.delete(`/api/documents/${documentId}`);
  },

  async uploadGeneric(
    initiativeId: number,
    file: File,
    libraryType: 'admin' | 'core' | 'ancillary',
    metadata?: DocumentUploadRequest
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('initiative_id', initiativeId.toString());
    
    if (metadata?.document_type) {
      formData.append('document_type', metadata.document_type);
    }
    if (metadata?.description) {
      formData.append('description', metadata.description);
    }
    if (metadata?.tags) {
      formData.append('tags', metadata.tags);
    }
    if (metadata?.category) {
      formData.append('category', metadata.category);
    }
    if (metadata?.is_required !== undefined) {
      formData.append('is_required', metadata.is_required.toString());
    }

    let endpoint: string;
    switch (libraryType) {
      case 'admin':
        endpoint = '/api/admin/documents';
        break;
      case 'core':
        endpoint = `/api/initiatives/${initiativeId}/documents/core`;
        break;
      case 'ancillary':
        endpoint = `/api/initiatives/${initiativeId}/documents/ancillary`;
        break;
      default:
        throw new Error('Invalid library type');
    }

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
};

// Export the api instance for direct use if needed
export default api;