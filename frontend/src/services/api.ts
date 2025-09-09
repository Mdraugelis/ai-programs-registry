import axios from 'axios';
import type { Initiative, User } from '../types/initiative';

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
    business_value: initiative.goal,
    technical_approach: `${initiative.approach_workflow || ''}\n\n${initiative.approach_technical || ''}`.trim(),
    start_date: null,
    end_date: null,
    status: 'active'
  };
};

// Map backend initiative to frontend format
const mapFromBackendInitiative = (backendInit: BackendInitiative): Initiative => {
  return {
    id: backendInit.id.toString(),
    title: backendInit.name,
    program_owner: backendInit.lead_name || '',
    executive_champion: '', // Not in backend schema
    department: backendInit.department || '',
    vendor_type: undefined,
    vendors: undefined,
    background: backendInit.description,
    goal: backendInit.business_value,
    approach_workflow: backendInit.technical_approach?.split('\n\n')[0] || '',
    approach_technical: backendInit.technical_approach?.split('\n\n')[1] || backendInit.technical_approach || '',
    ai_components: [],
    success_metrics: undefined,
    equity_considerations: undefined,
    risks: mapPriorityToRisk(backendInit.priority),
    benefits: undefined,
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
        updateData[key as keyof BackendInitiativeCreate] = value;
      }
    });
    
    const response = await api.put(`/api/initiatives/${id}`, updateData);
    return mapFromBackendInitiative(response.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/initiatives/${id}`);
  },
};

// Export the api instance for direct use if needed
export default api;