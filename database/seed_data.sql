-- Seed Data for AD-Aligned AI Programs Registry
-- Mock data for development and testing

-- =====================================================
-- DEPARTMENTS DATA
-- =====================================================
INSERT OR REPLACE INTO departments (dept_code, dept_name, parent_dept_code, dept_head_username, budget_code, location, description) VALUES
-- Top-level departments
('IT', 'Information Technology', NULL, 'john.smith', 'IT-001', 'Building A, Floor 3', 'Technology and digital infrastructure'),
('CARDIO', 'Cardiology', NULL, 'sarah.johnson', 'MED-CARDIO', 'Medical Center, Wing B', 'Cardiac care and cardiovascular services'),
('NEURO', 'Neurology', NULL, 'michael.brown', 'MED-NEURO', 'Medical Center, Wing C', 'Neurological care and brain health'),
('ADMIN', 'Administration', NULL, 'lisa.davis', 'ADM-001', 'Building A, Floor 1', 'Administrative and executive functions'),
('RESEARCH', 'Clinical Research', NULL, 'david.wilson', 'RES-001', 'Research Building, Floor 2', 'Clinical research and innovation'),

-- Sub-departments
('IT-AI', 'AI and Data Science', 'IT', 'emma.garcia', 'IT-AI-001', 'Building A, Floor 3', 'Artificial Intelligence and machine learning initiatives'),
('IT-INFRA', 'Infrastructure', 'IT', 'james.miller', 'IT-INF-001', 'Building A, Floor 3', 'Network and system infrastructure'),
('CARDIO-EP', 'Electrophysiology', 'CARDIO', 'robert.taylor', 'MED-CARD-EP', 'Medical Center, Wing B', 'Cardiac electrophysiology'),
('NEURO-STROKE', 'Stroke Center', 'NEURO', 'jennifer.anderson', 'MED-NEU-STR', 'Medical Center, Wing C', 'Stroke care and prevention');

-- =====================================================
-- AD USER CACHE DATA  
-- =====================================================
INSERT OR REPLACE INTO ad_user_cache (
    username, display_name, first_name, last_name, email, 
    department_code, title, manager_username, phone, location, employee_id
) VALUES
-- IT Department
('john.smith', 'John Smith', 'John', 'Smith', 'john.smith@company.com', 'IT', 'Chief Information Officer', NULL, '555-0101', 'Building A-301', 'EMP001'),
('emma.garcia', 'Emma Garcia', 'Emma', 'Garcia', 'emma.garcia@company.com', 'IT-AI', 'Director of AI and Data Science', 'john.smith', '555-0102', 'Building A-305', 'EMP002'),
('james.miller', 'James Miller', 'James', 'Miller', 'james.miller@company.com', 'IT-INFRA', 'Infrastructure Director', 'john.smith', '555-0103', 'Building A-307', 'EMP003'),
('alex.wong', 'Alex Wong', 'Alex', 'Wong', 'alex.wong@company.com', 'IT-AI', 'Senior Data Scientist', 'emma.garcia', '555-0104', 'Building A-305', 'EMP004'),
('maria.rodriguez', 'Maria Rodriguez', 'Maria', 'Rodriguez', 'maria.rodriguez@company.com', 'IT-AI', 'ML Engineer', 'emma.garcia', '555-0105', 'Building A-305', 'EMP005'),

-- Medical Departments  
('sarah.johnson', 'Dr. Sarah Johnson', 'Sarah', 'Johnson', 'sarah.johnson@company.com', 'CARDIO', 'Chief of Cardiology', NULL, '555-0201', 'Medical Center B-201', 'EMP006'),
('robert.taylor', 'Dr. Robert Taylor', 'Robert', 'Taylor', 'robert.taylor@company.com', 'CARDIO-EP', 'Director of Electrophysiology', 'sarah.johnson', '555-0202', 'Medical Center B-205', 'EMP007'),
('michael.brown', 'Dr. Michael Brown', 'Michael', 'Brown', 'michael.brown@company.com', 'NEURO', 'Chief of Neurology', NULL, '555-0301', 'Medical Center C-201', 'EMP008'),
('jennifer.anderson', 'Dr. Jennifer Anderson', 'Jennifer', 'Anderson', 'jennifer.anderson@company.com', 'NEURO-STROKE', 'Stroke Center Director', 'michael.brown', '555-0302', 'Medical Center C-210', 'EMP009'),

-- Administration
('lisa.davis', 'Lisa Davis', 'Lisa', 'Davis', 'lisa.davis@company.com', 'ADMIN', 'Chief Administrative Officer', NULL, '555-0401', 'Building A-101', 'EMP010'),
('david.wilson', 'Dr. David Wilson', 'David', 'Wilson', 'david.wilson@company.com', 'RESEARCH', 'Director of Clinical Research', NULL, '555-0501', 'Research Building-201', 'EMP011'),

-- Additional team members
('kevin.lee', 'Kevin Lee', 'Kevin', 'Lee', 'kevin.lee@company.com', 'IT-AI', 'AI Solutions Architect', 'emma.garcia', '555-0106', 'Building A-305', 'EMP012'),
('rachel.kim', 'Rachel Kim', 'Rachel', 'Kim', 'rachel.kim@company.com', 'RESEARCH', 'Clinical Research Manager', 'david.wilson', '555-0502', 'Research Building-203', 'EMP013'),
('chris.martinez', 'Chris Martinez', 'Chris', 'Martinez', 'chris.martinez@company.com', 'IT', 'IT Security Manager', 'john.smith', '555-0107', 'Building A-303', 'EMP014'),
('angela.white', 'Dr. Angela White', 'Angela', 'White', 'angela.white@company.com', 'CARDIO', 'Cardiologist', 'sarah.johnson', '555-0203', 'Medical Center B-208', 'EMP015'),

-- Mock admin users for testing
('admin.user', 'Admin User', 'Admin', 'User', 'admin.user@company.com', 'IT', 'System Administrator', 'john.smith', '555-0999', 'Building A-309', 'EMP999'),
('reviewer.user', 'Reviewer User', 'Reviewer', 'User', 'reviewer.user@company.com', 'ADMIN', 'Data Reviewer', 'lisa.davis', '555-0998', 'Building A-105', 'EMP998'),
('contributor.user', 'Contributor User', 'Contributor', 'User', 'contributor.user@company.com', 'RESEARCH', 'Research Assistant', 'david.wilson', '555-0997', 'Research Building-205', 'EMP997');

-- =====================================================
-- AI PROGRAMS DATA
-- =====================================================
INSERT OR REPLACE INTO ai_programs (
    program_name, program_code, description, department_code, 
    program_lead, business_sponsor, technical_lead,
    status, stage, priority,
    business_value, success_metrics, roi_projection, budget_allocated,
    technical_approach, tech_stack, data_sources,
    planned_start_date, planned_end_date,
    risk_level, compliance_requirements,
    tags, created_by
) VALUES
(
    'AI-Powered ECG Analysis System',
    'AI-ECG-001',
    'Machine learning system for automated ECG interpretation and arrhythmia detection to improve diagnostic accuracy and reduce physician workload.',
    'CARDIO',
    'robert.taylor',
    'sarah.johnson', 
    'alex.wong',
    'active',
    'development',
    'high',
    'Reduce ECG interpretation time by 70% and improve accuracy by 15%. Early detection of life-threatening arrhythmias.',
    'Time to interpretation < 30 seconds, Sensitivity > 95%, Specificity > 90%',
    25.5,
    750000.00,
    'Deep learning with convolutional neural networks trained on annotated ECG datasets. Integration with existing PACS systems.',
    '{"ml_framework": "TensorFlow", "backend": "Python/FastAPI", "database": "PostgreSQL", "deployment": "Docker/Kubernetes"}',
    'Historical ECG database (500K+ records), Real-time ECG feeds, Clinical annotations',
    '2024-01-15',
    '2024-08-30',
    'medium',
    'HIPAA, FDA 510(k) pathway for medical device software',
    'cardiology,ecg,machine-learning,diagnostic-imaging',
    'robert.taylor'
),
(
    'Predictive Patient Flow Analytics',
    'AI-FLOW-002', 
    'AI system to predict patient admission patterns, optimize bed allocation, and reduce wait times across all departments.',
    'ADMIN',
    'lisa.davis',
    'lisa.davis',
    'emma.garcia',
    'active',
    'pilot',
    'high',
    'Reduce average patient wait time by 40%, improve bed utilization by 25%, optimize staffing allocation.',
    'Wait time reduction > 35%, Bed utilization > 85%, Staff satisfaction score > 4.0/5.0',
    30.2,
    450000.00,
    'Time series forecasting using LSTM networks and ensemble methods. Real-time dashboard for operations team.',
    '{"ml_framework": "PyTorch", "backend": "Python/Django", "frontend": "React", "database": "MongoDB", "visualization": "D3.js"}',
    'EHR admission data, Scheduling system, Historical census data, Weather data, Local events calendar',
    '2024-02-01',
    '2024-07-15',
    'low',
    'HIPAA compliance for patient data handling',
    'operations,predictive-analytics,patient-flow,optimization',
    'lisa.davis'
),
(
    'Stroke Risk Assessment AI',
    'AI-STROKE-003',
    'Machine learning model to assess stroke risk in real-time using multiple clinical indicators and imaging data.',
    'NEURO-STROKE',
    'jennifer.anderson',
    'michael.brown',
    'maria.rodriguez',
    'active',
    'planning',
    'critical',
    'Enable early intervention for high-risk patients, reduce stroke incidence by 20%, improve patient outcomes.',
    'Risk prediction accuracy > 85%, False positive rate < 10%, Time to risk assessment < 5 minutes',
    45.0,
    900000.00,
    'Multi-modal machine learning combining structured clinical data, laboratory results, and medical imaging analysis.',
    '{"ml_framework": "Scikit-learn", "imaging": "PyTorch/MONAI", "backend": "FastAPI", "database": "PostgreSQL", "deployment": "AWS"}',
    'Patient vital signs, Laboratory results, CT/MRI imaging, Medical history, Medication records',
    '2024-03-01',
    '2024-12-31',
    'high',
    'HIPAA, FDA regulations for clinical decision support software',
    'neurology,stroke,risk-assessment,clinical-decision-support',
    'jennifer.anderson'
),
(
    'Clinical Research Data Mining Platform',
    'AI-RESEARCH-004',
    'AI-powered platform for automated literature review, clinical trial matching, and research hypothesis generation.',
    'RESEARCH',
    'david.wilson',
    'david.wilson',
    'kevin.lee',
    'active',
    'discovery',
    'medium',
    'Accelerate research discovery by 50%, improve clinical trial enrollment by 30%, enhance evidence-based medicine.',
    'Research query response time < 2 minutes, Trial matching accuracy > 80%, Literature coverage > 95%',
    20.0,
    350000.00,
    'Natural language processing for literature mining, graph-based knowledge representation, recommendation algorithms.',
    '{"nlp": "spaCy/Transformers", "database": "Neo4j", "backend": "Python/FastAPI", "frontend": "Vue.js", "search": "Elasticsearch"}',
    'PubMed database, ClinicalTrials.gov, Internal research database, EHR research data',
    '2024-04-01',
    '2024-10-15',
    'medium',
    'IRB approval for research data usage, Data use agreements with external sources',
    'research,nlp,literature-mining,clinical-trials',
    'david.wilson'
),
(
    'IT Infrastructure Anomaly Detection',
    'AI-INFRA-005',
    'Machine learning system for proactive detection of IT infrastructure anomalies and automated incident response.',
    'IT-INFRA',
    'james.miller',
    'john.smith',
    'chris.martinez',
    'active',
    'production',
    'medium',
    'Reduce system downtime by 60%, improve mean time to resolution by 45%, enable proactive maintenance.',
    'Downtime reduction > 50%, MTTR improvement > 40%, Anomaly detection accuracy > 90%',
    35.8,
    200000.00,
    'Unsupervised learning for anomaly detection, automated alerting system, integration with existing monitoring tools.',
    '{"ml_framework": "Scikit-learn", "monitoring": "Prometheus/Grafana", "backend": "Python", "automation": "Ansible"}',
    'System logs, Performance metrics, Network traffic data, Application monitoring data',
    '2023-09-01',
    '2024-03-31',
    'low',
    'Internal security policies, Data retention requirements',
    'infrastructure,anomaly-detection,monitoring,automation',
    'james.miller'
);

-- =====================================================
-- SAMPLE DOCUMENTS DATA
-- =====================================================
INSERT OR REPLACE INTO documents (
    program_id, filename, file_path, file_size, file_type, 
    document_type, version, description, uploaded_by, access_level
) VALUES
-- Documents for ECG Analysis System
(1, 'ECG_AI_Requirements.pdf', 'docs/ai-ecg-001/ECG_AI_Requirements.pdf', 2048576, 'application/pdf', 'requirements', '1.2', 'Functional and non-functional requirements for ECG AI system', 'robert.taylor', 'internal'),
(1, 'ECG_Model_Architecture.docx', 'docs/ai-ecg-001/ECG_Model_Architecture.docx', 1536000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'design', '2.0', 'Deep learning model architecture and training approach', 'alex.wong', 'confidential'),
(1, 'FDA_510k_Submission_Draft.pdf', 'docs/ai-ecg-001/FDA_510k_Submission_Draft.pdf', 4194304, 'application/pdf', 'regulatory', '1.0', 'Draft submission for FDA 510(k) clearance', 'sarah.johnson', 'restricted'),

-- Documents for Patient Flow Analytics
(2, 'Patient_Flow_Analysis.xlsx', 'docs/ai-flow-002/Patient_Flow_Analysis.xlsx', 3072000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'analysis', '1.1', 'Historical patient flow data analysis and patterns', 'emma.garcia', 'internal'),
(2, 'Pilot_Implementation_Plan.pdf', 'docs/ai-flow-002/Pilot_Implementation_Plan.pdf', 1792000, 'application/pdf', 'project_plan', '1.3', 'Detailed implementation plan for pilot phase', 'lisa.davis', 'internal'),

-- Documents for Stroke Risk Assessment
(3, 'Stroke_Risk_Literature_Review.pdf', 'docs/ai-stroke-003/Stroke_Risk_Literature_Review.pdf', 6291456, 'application/pdf', 'research', '1.0', 'Comprehensive literature review of stroke risk factors and prediction models', 'jennifer.anderson', 'internal'),
(3, 'Clinical_Data_Dictionary.csv', 'docs/ai-stroke-003/Clinical_Data_Dictionary.csv', 51200, 'text/csv', 'documentation', '2.1', 'Data dictionary for clinical variables used in stroke risk model', 'maria.rodriguez', 'confidential'),

-- Documents for Research Platform
(4, 'NLP_Pipeline_Design.md', 'docs/ai-research-004/NLP_Pipeline_Design.md', 102400, 'text/markdown', 'technical', '1.0', 'Natural language processing pipeline architecture', 'kevin.lee', 'internal'),

-- Documents for Infrastructure Monitoring
(5, 'Anomaly_Detection_Metrics.json', 'docs/ai-infra-005/Anomaly_Detection_Metrics.json', 25600, 'application/json', 'metrics', '3.2', 'Performance metrics and thresholds for anomaly detection system', 'chris.martinez', 'internal');

-- =====================================================
-- SAMPLE AUDIT LOG DATA
-- =====================================================
INSERT INTO audit_log (
    table_name, record_id, operation, field_name, 
    old_value, new_value, changed_by, change_reason, session_id, ip_address
) VALUES
('ai_programs', '1', 'UPDATE', 'stage', 'pilot', 'development', 'robert.taylor', 'Moved from pilot to full development phase', 'sess_001', '10.1.1.100'),
('ai_programs', '2', 'UPDATE', 'budget_spent', '0.00', '125000.00', 'lisa.davis', 'Q1 budget allocation spent on infrastructure', 'sess_002', '10.1.1.101'),
('ai_programs', '3', 'INSERT', NULL, NULL, NULL, 'jennifer.anderson', 'New stroke risk assessment program created', 'sess_003', '10.1.1.102'),
('documents', '1', 'INSERT', NULL, NULL, NULL, 'robert.taylor', 'Requirements document uploaded', 'sess_004', '10.1.1.100'),
('ad_user_cache', 'alex.wong', 'UPDATE', 'title', 'Data Scientist', 'Senior Data Scientist', 'emma.garcia', 'Promotion effective Q2', 'sess_005', '10.1.1.103');