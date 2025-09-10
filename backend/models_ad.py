"""
AD-Aligned Database Models for AI Programs Registry
Pydantic models for the new AD-integrated schema
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from decimal import Decimal
import json

# =====================================================
# DATABASE TABLE SCHEMAS (SQL)
# =====================================================

# Import original schema SQL from database/schema.sql
# These are the actual table definitions

# =====================================================
# PYDANTIC MODELS FOR API
# =====================================================

# -------------------- DEPARTMENT MODELS --------------------

class DepartmentBase(BaseModel):
    dept_code: str = Field(..., description="Department code (uppercase)")
    dept_name: str = Field(..., description="Department full name")
    parent_dept_code: Optional[str] = Field(None, description="Parent department code")
    dept_head_username: Optional[str] = Field(None, description="Department head AD username")
    budget_code: Optional[str] = Field(None, description="Budget tracking code")
    location: Optional[str] = Field(None, description="Physical location")
    description: Optional[str] = Field(None, description="Department description")
    is_active: bool = Field(True, description="Active status")
    
    @validator('dept_code')
    def dept_code_must_be_uppercase(cls, v):
        return v.upper() if v else v
    
class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(DepartmentBase):
    dept_code: Optional[str] = None
    dept_name: Optional[str] = None

class Department(DepartmentBase):
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# -------------------- AD USER MODELS --------------------

class ADUserBase(BaseModel):
    username: str = Field(..., description="AD username (lowercase)")
    display_name: str = Field(..., description="Full display name")
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    email: Optional[str] = Field(None, description="Email address")
    department_code: Optional[str] = Field(None, description="Primary department")
    title: Optional[str] = Field(None, description="Job title")
    manager_username: Optional[str] = Field(None, description="Manager's AD username")
    phone: Optional[str] = Field(None, description="Phone number")
    location: Optional[str] = Field(None, description="Office location")
    employee_id: Optional[str] = Field(None, description="Employee ID")
    is_active: bool = Field(True, description="Active status")
    
    @validator('username')
    def username_must_be_lowercase(cls, v):
        return v.lower() if v else v
    
class ADUserCreate(ADUserBase):
    pass

class ADUserUpdate(ADUserBase):
    username: Optional[str] = None
    display_name: Optional[str] = None

class ADUser(ADUserBase):
    last_ad_sync: Optional[datetime] = Field(None, description="Last AD sync timestamp")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# -------------------- AI PROGRAMS MODELS --------------------

class AIValidationMixin:
    """Validation methods for AI Programs"""
    
    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['active', 'on_hold', 'completed', 'cancelled']
        if v and v not in valid_statuses:
            raise ValueError(f'Status must be one of: {valid_statuses}')
        return v
    
    @validator('stage')
    def validate_stage(cls, v):
        valid_stages = ['discovery', 'planning', 'development', 'pilot', 'production', 'retired']
        if v and v not in valid_stages:
            raise ValueError(f'Stage must be one of: {valid_stages}')
        return v
        
    @validator('priority')
    def validate_priority(cls, v):
        valid_priorities = ['low', 'medium', 'high', 'critical']
        if v and v not in valid_priorities:
            raise ValueError(f'Priority must be one of: {valid_priorities}')
        return v
        
    @validator('risk_level')
    def validate_risk_level(cls, v):
        valid_risks = ['low', 'medium', 'high', 'critical']
        if v and v not in valid_risks:
            raise ValueError(f'Risk level must be one of: {valid_risks}')
        return v
        
    @validator('security_classification')
    def validate_security_classification(cls, v):
        valid_classifications = ['public', 'internal', 'confidential', 'restricted']
        if v and v not in valid_classifications:
            raise ValueError(f'Security classification must be one of: {valid_classifications}')
        return v

class AIProgramBase(BaseModel, AIValidationMixin):
    program_name: str = Field(..., description="Program/initiative name")
    program_code: Optional[str] = Field(None, description="Short code identifier")
    description: Optional[str] = Field(None, description="Detailed description")
    department_code: str = Field(..., description="Owning department code")
    program_lead: str = Field(..., description="Program lead AD username")
    business_sponsor: Optional[str] = Field(None, description="Business sponsor AD username")
    technical_lead: Optional[str] = Field(None, description="Technical lead AD username")
    
    # Status and Stage
    status: str = Field('active', description="Program status")
    stage: str = Field('discovery', description="Program stage")
    priority: str = Field('medium', description="Program priority")
    
    # Business Information
    business_value: Optional[str] = Field(None, description="Business value description")
    success_metrics: Optional[str] = Field(None, description="Success criteria and KPIs")
    roi_projection: Optional[Decimal] = Field(None, description="ROI projection percentage")
    budget_allocated: Optional[Decimal] = Field(None, description="Allocated budget")
    budget_spent: Optional[Decimal] = Field(0, description="Spent budget")
    
    # Technical Information
    technical_approach: Optional[str] = Field(None, description="Technical implementation approach")
    tech_stack: Optional[str] = Field(None, description="Technology stack (JSON)")
    data_sources: Optional[str] = Field(None, description="Data sources used")
    security_classification: str = Field('internal', description="Security classification")
    
    # Timeline
    planned_start_date: Optional[date] = Field(None, description="Planned start date")
    actual_start_date: Optional[date] = Field(None, description="Actual start date")
    planned_end_date: Optional[date] = Field(None, description="Planned completion date")
    actual_end_date: Optional[date] = Field(None, description="Actual completion date")
    last_milestone: Optional[str] = Field(None, description="Last achieved milestone")
    next_milestone: Optional[str] = Field(None, description="Next milestone target")
    
    # Risk and Compliance
    risk_level: str = Field('medium', description="Risk level")
    compliance_requirements: Optional[str] = Field(None, description="Regulatory compliance needs")
    data_privacy_impact: Optional[str] = Field(None, description="Privacy impact assessment")
    
    # Flexible Attributes
    custom_attributes: Optional[str] = Field(None, description="JSON for additional attributes")
    tags: Optional[str] = Field(None, description="Comma-separated tags")
    
    @validator('budget_spent')
    def budget_spent_not_exceed_allocated(cls, v, values):
        if v and 'budget_allocated' in values and values['budget_allocated']:
            if v > values['budget_allocated']:
                raise ValueError('Budget spent cannot exceed budget allocated')
        return v
    
    @validator('actual_end_date')
    def actual_end_date_after_start(cls, v, values):
        if v and 'actual_start_date' in values and values['actual_start_date']:
            if v < values['actual_start_date']:
                raise ValueError('Actual end date must be after actual start date')
        return v
    
    @validator('planned_end_date')
    def planned_end_date_after_start(cls, v, values):
        if v and 'planned_start_date' in values and values['planned_start_date']:
            if v < values['planned_start_date']:
                raise ValueError('Planned end date must be after planned start date')
        return v

class AIProgramCreate(AIProgramBase):
    created_by: str = Field(..., description="Creator AD username")

class AIProgramUpdate(AIProgramBase):
    program_name: Optional[str] = None
    department_code: Optional[str] = None
    program_lead: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = Field(None, description="Last updater AD username")

class AIProgram(AIProgramBase):
    program_id: int
    created_by: str
    created_at: datetime
    updated_by: Optional[str] = None
    updated_at: datetime
    
    # Parsed custom attributes for convenience
    custom_attributes_parsed: Optional[Dict[str, Any]] = None
    tags_list: Optional[List[str]] = None
    
    class Config:
        from_attributes = True
    
    @validator('custom_attributes_parsed', pre=False, always=True)
    def parse_custom_attributes(cls, v, values):
        if 'custom_attributes' in values and values['custom_attributes']:
            try:
                return json.loads(values['custom_attributes'])
            except (json.JSONDecodeError, TypeError):
                return None
        return None
    
    @validator('tags_list', pre=False, always=True)
    def parse_tags(cls, v, values):
        if 'tags' in values and values['tags']:
            return [tag.strip() for tag in values['tags'].split(',') if tag.strip()]
        return []

# -------------------- DOCUMENT MODELS --------------------

class DocumentBase(BaseModel):
    program_id: int = Field(..., description="AI program ID")
    filename: str = Field(..., description="Original filename")
    file_path: str = Field(..., description="Storage path")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    file_type: Optional[str] = Field(None, description="MIME type")
    document_type: Optional[str] = Field(None, description="Document category")
    version: str = Field('1.0', description="Document version")
    description: Optional[str] = Field(None, description="Document description")
    uploaded_by: str = Field(..., description="Uploader AD username")
    is_active: bool = Field(True, description="Active status")
    access_level: str = Field('internal', description="Access level")
    
    @validator('access_level')
    def validate_access_level(cls, v):
        valid_levels = ['public', 'internal', 'confidential', 'restricted']
        if v and v not in valid_levels:
            raise ValueError(f'Access level must be one of: {valid_levels}')
        return v
    
    @validator('file_size')
    def file_size_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('File size must be non-negative')
        return v

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(DocumentBase):
    program_id: Optional[int] = None
    filename: Optional[str] = None
    file_path: Optional[str] = None
    uploaded_by: Optional[str] = None

class Document(DocumentBase):
    document_id: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

# -------------------- AUDIT LOG MODELS --------------------

class AuditLogBase(BaseModel):
    table_name: str = Field(..., description="Table that was modified")
    record_id: str = Field(..., description="Primary key of modified record")
    operation: str = Field(..., description="Operation type")
    field_name: Optional[str] = Field(None, description="Field changed (for UPDATEs)")
    old_value: Optional[str] = Field(None, description="Previous value")
    new_value: Optional[str] = Field(None, description="New value")
    changed_by: str = Field(..., description="User who made change")
    change_reason: Optional[str] = Field(None, description="Reason for change")
    session_id: Optional[str] = Field(None, description="Session identifier")
    ip_address: Optional[str] = Field(None, description="Client IP address")
    
    @validator('operation')
    def validate_operation(cls, v):
        valid_operations = ['INSERT', 'UPDATE', 'DELETE']
        if v and v not in valid_operations:
            raise ValueError(f'Operation must be one of: {valid_operations}')
        return v

class AuditLogCreate(AuditLogBase):
    pass

class AuditLog(AuditLogBase):
    audit_id: int
    changed_at: datetime
    
    class Config:
        from_attributes = True

# -------------------- BACKWARD COMPATIBILITY MODELS --------------------
# These maintain compatibility with existing API endpoints

class LegacyInitiative(BaseModel):
    """Legacy initiative model for backward compatibility"""
    id: int
    name: str
    description: Optional[str] = None
    department: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    lead_name: Optional[str] = None
    lead_email: Optional[str] = None
    business_value: Optional[str] = None
    technical_approach: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class LegacyUser(BaseModel):
    """Legacy user model for backward compatibility"""
    id: int
    username: str
    email: str
    role: str
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# -------------------- SEARCH AND FILTER MODELS --------------------

class ProgramSearchFilters(BaseModel):
    """Search and filter options for AI programs"""
    department_code: Optional[str] = None
    status: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    program_lead: Optional[str] = None
    risk_level: Optional[str] = None
    security_classification: Optional[str] = None
    tags: Optional[str] = None  # Comma-separated
    search_text: Optional[str] = None  # Full-text search
    start_date_from: Optional[date] = None
    start_date_to: Optional[date] = None
    end_date_from: Optional[date] = None
    end_date_to: Optional[date] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None

class PaginationParams(BaseModel):
    """Pagination parameters"""
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(100, ge=1, le=1000, description="Number of records to return")
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order")

# -------------------- RESPONSE MODELS --------------------

class ProgramListResponse(BaseModel):
    """Response model for program list endpoint"""
    programs: List[AIProgram]
    total_count: int
    page_info: Dict[str, Any]

class DepartmentHierarchy(BaseModel):
    """Department with hierarchy information"""
    dept_code: str
    dept_name: str
    level: int
    parent_dept_code: Optional[str] = None
    children: List['DepartmentHierarchy'] = []
    
    class Config:
        from_attributes = True

# Enable forward references
DepartmentHierarchy.model_rebuild()

# -------------------- STATISTICS MODELS --------------------

class DepartmentStats(BaseModel):
    """Statistics for a department"""
    dept_code: str
    dept_name: str
    total_programs: int
    active_programs: int
    completed_programs: int
    total_budget: Optional[Decimal] = None
    spent_budget: Optional[Decimal] = None

class ProgramStats(BaseModel):
    """Overall program statistics"""
    total_programs: int
    by_status: Dict[str, int]
    by_stage: Dict[str, int]
    by_priority: Dict[str, int]
    by_risk_level: Dict[str, int]
    total_budget: Optional[Decimal] = None
    total_spent: Optional[Decimal] = None
    department_stats: List[DepartmentStats]