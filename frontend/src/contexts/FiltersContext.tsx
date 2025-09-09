import React, { createContext, useContext, useState, useCallback } from 'react';
import type { FilterState, PaginationState, SortState } from '../types/initiative';

interface FiltersContextType {
  filters: FilterState;
  pagination: PaginationState;
  sort: SortState;
  updateFilters: (filters: Partial<FilterState>) => void;
  updatePagination: (pagination: Partial<PaginationState>) => void;
  updateSort: (sort: Partial<SortState>) => void;
  clearFilters: () => void;
  resetPagination: () => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export function useFilters() {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
}

interface FiltersProviderProps {
  children: React.ReactNode;
}

const defaultFilters: FilterState = {
  search: '',
  stage: undefined,
  department: undefined,
  risk: undefined,
};

const defaultPagination: PaginationState = {
  page: 1,
  pageSize: 25,
  total: 0,
};

const defaultSort: SortState = {
  field: 'updated_at',
  direction: 'desc',
};

export function FiltersProvider({ children }: FiltersProviderProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [pagination, setPagination] = useState<PaginationState>(defaultPagination);
  const [sort, setSort] = useState<SortState>(defaultSort);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const updatePagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  const updateSort = useCallback((newSort: Partial<SortState>) => {
    setSort(prev => ({ ...prev, ...newSort }));
    // Reset to first page when sort changes
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const resetPagination = useCallback(() => {
    setPagination(defaultPagination);
  }, []);

  return (
    <FiltersContext.Provider value={{
      filters,
      pagination,
      sort,
      updateFilters,
      updatePagination,
      updateSort,
      clearFilters,
      resetPagination,
    }}>
      {children}
    </FiltersContext.Provider>
  );
}