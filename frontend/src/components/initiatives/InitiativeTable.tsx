import React from 'react';
import { Link } from 'react-router-dom';
import type { Initiative } from '../../types/initiative';
import { useFilters } from '../../contexts/FiltersContext';

interface InitiativeTableProps {
  initiatives: Initiative[];
}

const InitiativeTable: React.FC<InitiativeTableProps> = ({ initiatives }) => {
  const { sort, updateSort } = useFilters();

  const handleSort = (field: keyof Initiative) => {
    if (sort.field === field) {
      updateSort({ direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSort({ field, direction: 'asc' });
    }
  };

  const SortIcon: React.FC<{ field: keyof Initiative }> = ({ field }) => {
    if (sort.field !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sort.direction === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'idea':
        return 'bg-gray-100 text-gray-800';
      case 'proposal':
        return 'bg-blue-100 text-blue-800';
      case 'pilot':
        return 'bg-yellow-100 text-yellow-800';
      case 'production':
        return 'bg-green-100 text-green-800';
      case 'retired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risks?: string) => {
    if (!risks) return 'bg-gray-100 text-gray-800';
    
    const riskLevel = risks.toLowerCase();
    if (riskLevel.includes('high')) {
      return 'bg-red-100 text-red-800';
    } else if (riskLevel.includes('medium')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (riskLevel.includes('low')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (initiatives.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No initiatives found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
        <div className="mt-6">
          <Link
            to="/initiatives/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Create your first initiative
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Title
                  <SortIcon field="title" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('program_owner')}
              >
                <div className="flex items-center">
                  Owner
                  <SortIcon field="program_owner" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('department')}
              >
                <div className="flex items-center">
                  Department
                  <SortIcon field="department" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('stage')}
              >
                <div className="flex items-center">
                  Stage
                  <SortIcon field="stage" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('updated_at')}
              >
                <div className="flex items-center">
                  Updated
                  <SortIcon field="updated_at" />
                </div>
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {initiatives.map((initiative) => (
              <tr key={initiative.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <Link
                      to={`/initiatives/${initiative.id}`}
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      {initiative.title}
                    </Link>
                    <div className="text-gray-500 truncate max-w-xs" title={initiative.background}>
                      {initiative.background || 'No description'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {initiative.program_owner}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {initiative.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(initiative.stage)}`}>
                    {initiative.stage}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(initiative.risks)}`}>
                    {initiative.risks?.split(' ')[0] || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(initiative.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    to={`/initiatives/${initiative.id}/edit`}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/initiatives/${initiative.id}`}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InitiativeTable;