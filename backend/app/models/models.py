"""
SQLAlchemy DB Models (mapped to supersonic schema v2).
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer, SmallInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    health_status = Column(String(50), nullable=False, default="unknown")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="projects")
    jira_projects = relationship("JiraProject", back_populates="project", cascade="all, delete-orphan")
    repositories = relationship("Repository", back_populates="project", cascade="all, delete-orphan")


class JiraProject(Base):
    __tablename__ = "jira_projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    jira_key = Column(String(50), nullable=False) # e.g. "PROJ"
    jira_url = Column(String(255), nullable=False)
    jira_email = Column(Text, nullable=True)
    jira_api_token_encrypted = Column(Text, nullable=True) # Will store the encrypted token
    auth_type = Column(Text, nullable=False, default="basic")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    project = relationship("Project", back_populates="jira_projects")


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=False) # e.g., 'github'
    repo_owner = Column(String(255), nullable=False)
    repo_name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="repositories")


def _get_uuid():
    return uuid.uuid4()

class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_get_uuid)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String(50), nullable=False) # 'github' or 'jira'
    status = Column(String(50), nullable=False, default="running") # 'running', 'success', 'error'
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    events_count = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    error_logs = Column(JSONB, nullable=True) # [{"time": "...", "msg": "..."}]

    project = relationship("Project")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_get_uuid)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String(50), nullable=False) # 'jira' or 'github_pr'
    external_id = Column(String(255), nullable=False, index=True) # e.g. "PROJ-123" or "PR#45"
    title = Column(Text, nullable=False)
    status = Column(String(100), nullable=False)
    author = Column(String(255), nullable=True)
    created_at_ext = Column(DateTime(timezone=True), nullable=True) # date created in external system
    updated_at_ext = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(JSONB, nullable=True) # store points, labels, anything else

    project = relationship("Project")


class Commit(Base):
    __tablename__ = "commits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_get_uuid)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    repository_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    commit_hash = Column(String(255), nullable=False, index=True)
    message = Column(Text, nullable=False)
    author = Column(String(255), nullable=True)
    date_ext = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project")
    repository = relationship("Repository")
