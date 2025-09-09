import React from 'react';
import { useFilters } from '../../contexts/FiltersContext';
import { departments, stages, riskLevels } from '../../services/mockData';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { filters, updateFilters, clearFilters } = useFilters();

  const handleFilterChange = (key: string, value: string) => {
    updateFilters({ [key]: value === '' ? undefined : value });
  };

  return (
    <aside
      className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0'
      } overflow-hidden`}
    >
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear All
          </button>
        </div>

        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search initiatives..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Stage Filter */}
        <div>
          <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
            Stage
          </label>
          <select
            id="stage"
            value={filters.stage || ''}
            onChange={(e) => handleFilterChange('stage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Stages</option>
            {stages.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            id="department"
            value={filters.department || ''}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Filter */}
        <div>
          <label htmlFor="risk" className="block text-sm font-medium text-gray-700 mb-2">
            Risk Level
          </label>
          <select
            id="risk"
            value={filters.risk || ''}
            onChange={(e) => handleFilterChange('risk', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Risk Levels</option>
            {riskLevels.map((risk) => (
              <option key={risk.value} value={risk.value}>
                {risk.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Summary */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h3>
          <div className="space-y-1 text-sm text-gray-600">
            {filters.search && (
              <div className="flex justify-between">
                <span>Search:</span>
                <span className="font-medium">"{filters.search}"</span>
              </div>
            )}
            {filters.stage && (
              <div className="flex justify-between">
                <span>Stage:</span>
                <span className="font-medium capitalize">{filters.stage}</span>
              </div>
            )}
            {filters.department && (
              <div className="flex justify-between">
                <span>Department:</span>
                <span className="font-medium">{filters.department}</span>
              </div>
            )}
            {filters.risk && (
              <div className="flex justify-between">
                <span>Risk:</span>
                <span className="font-medium capitalize">{filters.risk}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;