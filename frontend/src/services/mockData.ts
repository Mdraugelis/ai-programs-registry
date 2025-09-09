import type { Initiative } from '../types/initiative';

export const mockInitiatives: Initiative[] = [
  {
    id: 'init_001',
    title: 'AI-Powered Radiology Screening',
    program_owner: 'Dr. Sarah Johnson',
    executive_champion: 'Dr. Michael Chen',
    department: 'Radiology',
    vendor_type: 'Commercial',
    vendors: 'RadiologyAI Inc.',
    background: 'Current chest X-ray screening process is time-intensive and prone to human error. We need to implement AI assistance to improve accuracy and efficiency.',
    goal: 'Reduce screening time by 40% while maintaining 99.5% accuracy in detecting pulmonary nodules',
    approach_workflow: 'AI will pre-screen all chest X-rays and flag potential abnormalities for radiologist review',
    approach_technical: 'Deep learning CNN model trained on 100K+ chest X-ray images with radiologist annotations',
    ai_components: ['Computer Vision', 'Deep Learning'],
    success_metrics: 'Screening time reduction, accuracy metrics, false positive/negative rates',
    equity_considerations: 'Ensure model performance is consistent across different demographic groups',
    risks: 'Medium - potential for false negatives, requires careful validation',
    benefits: 'Improved patient outcomes, reduced radiologist workload, faster diagnosis',
    stage: 'pilot',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-15T14:30:00Z',
    created_by: 'sarah.johnson@geisinger.org'
  },
  {
    id: 'init_002',
    title: 'Natural Language Processing for Clinical Notes',
    program_owner: 'Dr. Robert Martinez',
    executive_champion: 'Dr. Lisa Wong',
    department: 'Informatics',
    vendor_type: 'Open Source',
    vendors: 'Internal Development',
    background: 'Clinical documentation contains valuable insights that are difficult to extract manually',
    goal: 'Automatically extract key clinical indicators from unstructured notes to support quality metrics',
    approach_workflow: 'NLP pipeline processes clinical notes to identify risk factors, medications, and outcomes',
    approach_technical: 'Transformer-based model fine-tuned on clinical text with HIPAA-compliant infrastructure',
    ai_components: ['Natural Language Processing', 'Information Extraction'],
    success_metrics: 'Extraction accuracy, time saved, quality score improvements',
    equity_considerations: 'Validate performance across different provider documentation styles',
    risks: 'Low - read-only analysis of existing data',
    benefits: 'Better quality reporting, reduced manual chart review time',
    stage: 'production',
    created_at: '2024-11-15T09:15:00Z',
    updated_at: '2024-12-20T11:45:00Z',
    created_by: 'robert.martinez@geisinger.org'
  },
  {
    id: 'init_003',
    title: 'Predictive Analytics for Sepsis Detection',
    program_owner: 'Dr. Amanda Foster',
    executive_champion: 'Dr. David Kumar',
    department: 'Critical Care',
    vendor_type: 'Commercial',
    vendors: 'Epic + Custom ML',
    background: 'Early sepsis detection is critical for patient outcomes but current alerting has high false positive rates',
    goal: 'Implement ML-based early warning system with <10% false positive rate and >90% sensitivity',
    approach_workflow: 'Real-time analysis of vital signs, lab values, and clinical notes to generate sepsis risk scores',
    approach_technical: 'Ensemble model combining gradient boosting and neural networks, integrated with Epic EHR',
    ai_components: ['Predictive Modeling', 'Real-time Analytics'],
    success_metrics: 'Sensitivity, specificity, time to detection, clinical outcomes',
    equity_considerations: 'Ensure model performance across age groups and comorbidity profiles',
    risks: 'High - clinical decision support requires careful validation and monitoring',
    benefits: 'Reduced sepsis mortality, earlier interventions, improved patient safety',
    stage: 'proposal',
    created_at: '2024-12-10T16:20:00Z',
    updated_at: '2024-12-18T13:10:00Z',
    created_by: 'amanda.foster@geisinger.org'
  },
  {
    id: 'init_004',
    title: 'Automated Medication Reconciliation',
    program_owner: 'PharmD Jennifer Liu',
    executive_champion: 'Dr. Thomas Anderson',
    department: 'Pharmacy',
    vendor_type: 'Hybrid',
    vendors: 'MedRec AI + Internal',
    background: 'Medication reconciliation is time-consuming and error-prone, leading to patient safety risks',
    goal: 'Automate 80% of routine medication reconciliation tasks while maintaining accuracy',
    approach_workflow: 'AI compares medication lists from multiple sources and flags discrepancies for pharmacist review',
    approach_technical: 'NLP for medication extraction + rule-based reconciliation + ML for risk scoring',
    ai_components: ['Natural Language Processing', 'Rule-based Systems'],
    success_metrics: 'Time savings, error reduction, pharmacist satisfaction, patient safety events',
    equity_considerations: 'Validate across different medication types and patient populations',
    risks: 'Medium - medication errors have serious consequences',
    benefits: 'Improved patient safety, reduced pharmacist workload, faster discharge processing',
    stage: 'idea',
    created_at: '2024-12-05T08:45:00Z',
    updated_at: '2024-12-12T15:30:00Z',
    created_by: 'jennifer.liu@geisinger.org'
  },
  {
    id: 'init_005',
    title: 'AI Chatbot for Patient Education',
    program_owner: 'Maria Gonzalez, RN',
    executive_champion: 'Dr. Patricia Williams',
    department: 'Patient Experience',
    vendor_type: 'Commercial',
    vendors: 'HealthBot Solutions',
    background: 'Patients have many questions post-discharge but limited access to immediate guidance',
    goal: 'Provide 24/7 patient education support with 90% user satisfaction rating',
    approach_workflow: 'Chatbot answers common questions, provides medication reminders, and escalates complex issues',
    approach_technical: 'Large language model fine-tuned on medical education content with safety guardrails',
    ai_components: ['Conversational AI', 'Natural Language Understanding'],
    success_metrics: 'User engagement, satisfaction scores, reduction in unnecessary calls',
    equity_considerations: 'Support multiple languages and varying health literacy levels',
    risks: 'Medium - must avoid providing medical advice, require clear limitations',
    benefits: 'Improved patient engagement, reduced call center volume, better health outcomes',
    stage: 'pilot',
    created_at: '2024-11-28T12:30:00Z',
    updated_at: '2024-12-14T09:20:00Z',
    created_by: 'maria.gonzalez@geisinger.org'
  }
];

export const departments = [
  'Radiology',
  'Informatics', 
  'Critical Care',
  'Pharmacy',
  'Patient Experience',
  'Cardiology',
  'Emergency Medicine',
  'Pathology',
  'Surgery',
  'Nursing'
];

export const stages = [
  { value: 'idea', label: 'Idea' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'production', label: 'Production' },
  { value: 'retired', label: 'Retired' }
];

export const riskLevels = [
  { value: 'low', label: 'Low Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'high', label: 'High Risk' }
];

export const aiComponents = [
  'Computer Vision',
  'Natural Language Processing',
  'Deep Learning',
  'Machine Learning',
  'Predictive Modeling',
  'Information Extraction',
  'Real-time Analytics',
  'Conversational AI',
  'Natural Language Understanding',
  'Rule-based Systems',
  'Recommendation Systems'
];