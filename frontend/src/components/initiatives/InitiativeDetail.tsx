import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInitiatives } from '../../contexts/InitiativesContext';

const InitiativeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getInitiative, fetchInitiatives } = useInitiatives();

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  const initiative = id ? getInitiative(id) : null;

  if (!initiative) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Initiative not found</h1>
        <Link
          to="/initiatives"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back to initiatives
        </Link>
      </div>
    );
  }

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/initiatives"
            className="text-primary-600 hover:text-primary-700 font-medium mb-2 inline-block"
          >
            ← Back to initiatives
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{initiative.title}</h1>
        </div>
        <Link
          to={`/initiatives/${initiative.id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          Edit Initiative
        </Link>
      </div>

      {/* Overview Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Stage</h3>
            <span className={`mt-1 inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getStageColor(initiative.stage)}`}>
              {initiative.stage}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Program Owner</h3>
            <p className="mt-1 text-sm text-gray-900">{initiative.program_owner}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Department</h3>
            <p className="mt-1 text-sm text-gray-900">{initiative.department}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Executive Champion</h3>
            <p className="mt-1 text-sm text-gray-900">{initiative.executive_champion}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Created</h3>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(initiative.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(initiative.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Background & Goals */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Background & Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Background</h3>
              <p className="text-sm text-gray-900">{initiative.background || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Goal</h3>
              <p className="text-sm text-gray-900">{initiative.goal || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Technical Approach */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Technical Approach</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Workflow Approach</h3>
              <p className="text-sm text-gray-900">{initiative.approach_workflow || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Technical Implementation</h3>
              <p className="text-sm text-gray-900">{initiative.approach_technical || 'Not specified'}</p>
            </div>
          </div>
          {initiative.ai_components && initiative.ai_components.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">AI Components</h3>
              <div className="flex flex-wrap gap-2">
                {initiative.ai_components.map((component, index) => (
                  <span
                    key={index}
                    className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800"
                  >
                    {component}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Risk & Governance */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Risk & Governance</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Risk Assessment</h3>
              <p className="text-sm text-gray-900">{initiative.risks || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Equity Considerations</h3>
              <p className="text-sm text-gray-900">{initiative.equity_considerations || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Benefits</h3>
              <p className="text-sm text-gray-900">{initiative.benefits || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Success Metrics</h3>
              <p className="text-sm text-gray-900">{initiative.success_metrics || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Vendor Information */}
        {(initiative.vendor_type || initiative.vendors) && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vendor Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Vendor Type</h3>
                <p className="text-sm text-gray-900">{initiative.vendor_type || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Vendors</h3>
                <p className="text-sm text-gray-900">{initiative.vendors || 'Not specified'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitiativeDetail;