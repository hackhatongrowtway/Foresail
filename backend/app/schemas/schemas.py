"""
Pydantic Schemas for API Validation.
"""
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

# ==========================================
# Generic / Shared
# ==========================================
class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Projects
# ==========================================
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    organization_id: UUID

class ProjectResponse(ProjectBase, OrmBase):
    id: UUID
    organization_id: UUID
    health_status: str
    created_at: datetime
    updated_at: datetime


# ==========================================
# Jira Projects
# ==========================================
class JiraProjectBase(BaseModel):
    jira_key: str
    jira_url: str

class JiraProjectCreate(JiraProjectBase):
    project_id: UUID
    jira_email: Optional[str] = None
    jira_api_token: Optional[str] = None # Plain token input (API only, never returned)

class JiraProjectResponse(JiraProjectBase, OrmBase):
    id: UUID
    project_id: UUID
    auth_type: str
    created_at: datetime
    # We deliberately DO NOT return the API token in responses!
    # Returning the email might be useful for UI "Connected as: email"
    jira_email: Optional[str] = None 


# ==========================================
# Repositories
# ==========================================
class RepositoryBase(BaseModel):
    platform: str
    repo_owner: str
    repo_name: str

class RepositoryCreate(RepositoryBase):
    pass

class RepositoryResponse(RepositoryBase, OrmBase):
    id: UUID
    project_id: UUID
    created_at: datetime


# ==========================================
# Ingestion Runs
# ==========================================
class IngestionRunResponse(OrmBase):
    id: UUID
    project_id: UUID
    source: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    events_count: int
    errors_count: int
    error_logs: Optional[Any]


# ==========================================
# Tickets
# ==========================================
class TicketResponse(OrmBase):
    id: UUID
    project_id: UUID
    source: str
    external_id: str
    title: str
    status: str
    author: Optional[str]
    created_at_ext: Optional[datetime]
    updated_at_ext: Optional[datetime]
    metadata_json: Optional[Any]


# ==========================================
# Commits
# ==========================================
class CommitResponse(OrmBase):
    id: UUID
    project_id: UUID
    repository_id: UUID
    commit_hash: str
    message: str
    author: Optional[str]
    date_ext: Optional[datetime]
