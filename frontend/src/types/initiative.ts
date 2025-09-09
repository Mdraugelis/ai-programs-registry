export interface Initiative {
  id: string;
  title: string;
  program_owner: string;
  executive_champion: string;
  department: string;
  vendor_type?: string;
  vendors?: string;
  background?: string;
  goal?: string;
  approach_workflow?: string;
  approach_technical?: string;
  ai_components?: string[];
  success_metrics?: string;
  equity_considerations?: string;
  risks?: string;
  benefits?: string;
  stage: 'idea' | 'proposal' | 'pilot' | 'production' | 'retired';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface FilterState {
  search: string;
  stage?: string;
  department?: string;
  risk?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  field: keyof Initiative;
  direction: 'asc' | 'desc';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'contributor' | 'viewer';
}