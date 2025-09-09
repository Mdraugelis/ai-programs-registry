import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useInitiatives } from '../../contexts/InitiativesContext';
import { useAuth } from '../../contexts/AuthContext';
import { departments, aiComponents } from '../../services/mockData';

interface FormData {
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
}

const IntakeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { createInitiative, updateInitiative, getInitiative } = useInitiatives();
  
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    problem: false,
    technical: false,
    governance: false
  });

  const isEditing = Boolean(id);
  const existingInitiative = id ? getInitiative(id) : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset
  } = useForm<FormData>({
    defaultValues: {
      stage: 'idea',
      ai_components: []
    }
  });

  // Load existing data for editing
  useEffect(() => {
    if (isEditing && existingInitiative) {
      reset({
        title: existingInitiative.title,
        program_owner: existingInitiative.program_owner,
        executive_champion: existingInitiative.executive_champion,
        department: existingInitiative.department,
        vendor_type: existingInitiative.vendor_type,
        vendors: existingInitiative.vendors,
        background: existingInitiative.background,
        goal: existingInitiative.goal,
        approach_workflow: existingInitiative.approach_workflow,
        approach_technical: existingInitiative.approach_technical,
        ai_components: existingInitiative.ai_components,
        success_metrics: existingInitiative.success_metrics,
        equity_considerations: existingInitiative.equity_considerations,
        risks: existingInitiative.risks,
        benefits: existingInitiative.benefits,
        stage: existingInitiative.stage
      });
    }
  }, [isEditing, existingInitiative, reset]);

  // Auto-save draft functionality
  useEffect(() => {
    const subscription = watch((data) => {
      if (isDirty && !isEditing) {
        localStorage.setItem('initiative_draft', JSON.stringify(data));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isDirty, isEditing]);

  // Load draft on component mount
  useEffect(() => {
    if (!isEditing) {
      const draft = localStorage.getItem('initiative_draft');
      if (draft) {
        try {
          const draftData = JSON.parse(draft);
          Object.keys(draftData).forEach(key => {
            if (draftData[key]) {
              setValue(key as keyof FormData, draftData[key]);
            }
          });
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [isEditing, setValue]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (isEditing && existingInitiative) {
        await updateInitiative(existingInitiative.id, data);
      } else {
        await createInitiative({
          ...data,
          created_by: user.email
        });
        // Clear draft after successful submission
        localStorage.removeItem('initiative_draft');
      }
      navigate('/initiatives');
    } catch (error) {
      console.error('Failed to save initiative:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('initiative_draft');
    reset();
  };

  const handleCancel = () => {
    navigate('/initiatives');
  };

  const SectionHeader: React.FC<{ title: string; section: keyof typeof expandedSections; required?: boolean }> = ({ 
    title, 
    section, 
    required = false 
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <h2 className="text-lg font-medium text-gray-900">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </h2>
      <svg
        className={`w-5 h-5 text-gray-500 transform transition-transform ${
          expandedSections[section] ? 'rotate-180' : ''
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Initiative' : 'New AI Initiative'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isEditing ? 'Update your AI initiative details' : 'Submit a new AI initiative for review'}
          </p>
        </div>
        {!isEditing && isDirty && (
          <button
            type="button"
            onClick={clearDraft}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Draft
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <SectionHeader title="Basic Information" section="basic" required />
          {expandedSections.basic && (
            <div className="bg-white p-6 border border-gray-200 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Initiative Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="department"
                    {...register('department', { required: 'Department is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>}
                </div>

                <div>
                  <label htmlFor="program_owner" className="block text-sm font-medium text-gray-700">
                    Program Owner <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="program_owner"
                    {...register('program_owner', { required: 'Program owner is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.program_owner && <p className="mt-1 text-sm text-red-600">{errors.program_owner.message}</p>}
                </div>

                <div>
                  <label htmlFor="executive_champion" className="block text-sm font-medium text-gray-700">
                    Executive Champion <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="executive_champion"
                    {...register('executive_champion', { required: 'Executive champion is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.executive_champion && <p className="mt-1 text-sm text-red-600">{errors.executive_champion.message}</p>}
                </div>

                <div>
                  <label htmlFor="stage" className="block text-sm font-medium text-gray-700">
                    Current Stage <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="stage"
                    {...register('stage', { required: 'Stage is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="idea">Idea</option>
                    <option value="proposal">Proposal</option>
                    <option value="pilot">Pilot</option>
                    <option value="production">Production</option>
                    <option value="retired">Retired</option>
                  </select>
                  {errors.stage && <p className="mt-1 text-sm text-red-600">{errors.stage.message}</p>}
                </div>

                <div>
                  <label htmlFor="vendor_type" className="block text-sm font-medium text-gray-700">
                    Vendor Type
                  </label>
                  <select
                    id="vendor_type"
                    {...register('vendor_type')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Vendor Type</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Open Source">Open Source</option>
                    <option value="Internal">Internal Development</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="vendors" className="block text-sm font-medium text-gray-700">
                  Vendors
                </label>
                <input
                  type="text"
                  id="vendors"
                  {...register('vendors')}
                  placeholder="e.g., Microsoft, Google, Internal Team"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Problem & Goals Section */}
        <div className="space-y-4">
          <SectionHeader title="Problem & Goals" section="problem" />
          {expandedSections.problem && (
            <div className="bg-white p-6 border border-gray-200 rounded-lg space-y-4">
              <div>
                <label htmlFor="background" className="block text-sm font-medium text-gray-700">
                  Background & Problem Statement
                </label>
                <textarea
                  id="background"
                  rows={4}
                  {...register('background')}
                  placeholder="Describe the current problem or opportunity this initiative addresses..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700">
                  Goals & Expected Outcomes
                </label>
                <textarea
                  id="goal"
                  rows={4}
                  {...register('goal')}
                  placeholder="What specific goals will this initiative achieve? What are the expected outcomes?"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="success_metrics" className="block text-sm font-medium text-gray-700">
                  Success Metrics
                </label>
                <textarea
                  id="success_metrics"
                  rows={3}
                  {...register('success_metrics')}
                  placeholder="How will you measure success? Include specific metrics, KPIs, or outcomes..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Technical Approach Section */}
        <div className="space-y-4">
          <SectionHeader title="Technical Approach" section="technical" />
          {expandedSections.technical && (
            <div className="bg-white p-6 border border-gray-200 rounded-lg space-y-4">
              <div>
                <label htmlFor="approach_workflow" className="block text-sm font-medium text-gray-700">
                  Workflow Description
                </label>
                <textarea
                  id="approach_workflow"
                  rows={4}
                  {...register('approach_workflow')}
                  placeholder="Describe how this AI solution will fit into existing workflows..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="approach_technical" className="block text-sm font-medium text-gray-700">
                  Technical Implementation
                </label>
                <textarea
                  id="approach_technical"
                  rows={4}
                  {...register('approach_technical')}
                  placeholder="Describe the technical approach, architecture, models, or algorithms to be used..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  AI Components (select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {aiComponents.map(component => (
                    <label key={component} className="flex items-center">
                      <input
                        type="checkbox"
                        value={component}
                        {...register('ai_components')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{component}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Governance & Risk Section */}
        <div className="space-y-4">
          <SectionHeader title="Governance & Risk" section="governance" />
          {expandedSections.governance && (
            <div className="bg-white p-6 border border-gray-200 rounded-lg space-y-4">
              <div>
                <label htmlFor="risks" className="block text-sm font-medium text-gray-700">
                  Risk Assessment
                </label>
                <textarea
                  id="risks"
                  rows={4}
                  {...register('risks')}
                  placeholder="Identify potential risks, their severity (Low/Medium/High), and mitigation strategies..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="equity_considerations" className="block text-sm font-medium text-gray-700">
                  Equity Considerations
                </label>
                <textarea
                  id="equity_considerations"
                  rows={4}
                  {...register('equity_considerations')}
                  placeholder="How will you ensure fairness and avoid bias? Consider different patient populations, demographics, etc..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="benefits" className="block text-sm font-medium text-gray-700">
                  Expected Benefits
                </label>
                <textarea
                  id="benefits"
                  rows={4}
                  {...register('benefits')}
                  placeholder="What benefits will this initiative provide to patients, staff, and the organization?"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          
          <div className="flex space-x-3">
            {!isEditing && isDirty && (
              <span className="text-sm text-gray-500 italic">Draft saved automatically</span>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Initiative' : 'Submit Initiative'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default IntakeForm;