import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useInitiatives } from '../../contexts/InitiativesContext';
import { useFilters } from '../../contexts/FiltersContext';
import type { Initiative } from '../../types/initiative';
import InitiativeTable from './InitiativeTable';
import Pagination from './Pagination';

const InitiativeList: React.FC = () => {
  const { initiatives, isLoading, error, fetchInitiatives } = useInitiatives();
  const { filters, pagination, sort, updatePagination } = useFilters();

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  // Filter and sort initiatives
  const filteredAndSortedInitiatives = useMemo(() => {
    let filtered = initiatives.filter((initiative: Initiative) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          initiative.title.toLowerCase().includes(searchLower) ||
          initiative.program_owner.toLowerCase().includes(searchLower) ||
          initiative.department.toLowerCase().includes(searchLower) ||
          initiative.background?.toLowerCase().includes(searchLower) ||
          initiative.goal?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

    // Stage filter
    if (filters.stage) {
      filtered = filtered.filter(initiative => initiative.stage === filters.stage);
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(initiative => initiative.department === filters.department);
    }

    // Risk filter (extract from risks field)
    if (filters.risk) {
      filtered = filtered.filter(initiative => 
        initiative.risks?.toLowerCase().includes(filters.risk!)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [initiatives, filters, sort]);

  // Paginate results
  const paginatedInitiatives = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredAndSortedInitiatives.slice(startIndex, endIndex);
  }, [filteredAndSortedInitiatives, pagination.page, pagination.pageSize]);

  // Update pagination total when filtered results change
  useEffect(() => {
    updatePagination({ total: filteredAndSortedInitiatives.length });
  }, [filteredAndSortedInitiatives.length, updatePagination]);

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading initiatives</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Initiatives</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track AI initiatives across your organization
          </p>
        </div>
        <Link
          to="/initiatives/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Initiative
        </Link>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {paginatedInitiatives.length} of {filteredAndSortedInitiatives.length} initiatives
        </div>
        <div className="flex items-center space-x-4">
          <label htmlFor="pageSize" className="text-sm text-gray-600">
            Show:
          </label>
          <select
            id="pageSize"
            value={pagination.pageSize}
            onChange={(e) => updatePagination({ pageSize: parseInt(e.target.value), page: 1 })}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <InitiativeTable initiatives={paginatedInitiatives} />
      )}

      {/* Pagination */}
      {filteredAndSortedInitiatives.length > pagination.pageSize && (
        <Pagination />
      )}
    </div>
  );
};

export default InitiativeList;