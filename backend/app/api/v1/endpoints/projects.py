"""
Projects Endpoints — minimal CRUD used by the hackathon UI.

For the MVP we:
- Use a single default organization (same dummy UUID pattern used in jira.py)
- Create a Project + Repository record when a new project is registered
- Return a front-end–friendly shape with risk placeholders so the existing
  dashboard / projects table can switch from mock data to live data.
"""

from uuid import UUID
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import Organization, Project


router = APIRouter()


DEFAULT_ORG_ID = UUID("00000000-0000-0000-0000-000000000000")


async def _ensure_default_org(db: AsyncSession) -> Organization:
    """
    Ensure there is at least one organization to attach projects to.
    This mirrors the "dummy org" strategy used in jira.py.
    """
    result = await db.execute(select(Organization).where(Organization.id == DEFAULT_ORG_ID))
    org = result.scalar_one_or_none()
    if org:
        return org

    org = Organization(id=DEFAULT_ORG_ID, name="Default Org", slug="default-org")
    db.add(org)
    await db.flush()
    return org


def _serialize_project_with_repo(project: Project, full_repo: Optional[str]) -> dict:
    """
    Shape the project in the way the current React UI expects for list views.

    NOTE: Risk fields are placeholders until the scoring engine is wired.
    """
    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "repo": full_repo,
        # --- Risk-related placeholders for now (keeps UI layout working) ---
        "riskScore": 0,
        "trend": "stable",
        "classification": "healthy",
        "lastAnalysis": None,
        "alertCount": 0,
        "isEstimated": True,
        # Extra metadata that other screens might use later
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "health_status": project.health_status,
    }


@router.get("/", response_model=list[dict])
async def list_projects(
    organization_id: Optional[UUID] = Query(
        None,
        description="Organization filter. If omitted, uses the default org used by the hackathon UI.",
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    List projects for an organization, ordered by most recent.

    For the hackathon MVP, if no organization_id is provided we fall back
    to a shared default org so the UI works without an auth/tenant system.
    """
    if organization_id is None:
        await _ensure_default_org(db)
        org_id = DEFAULT_ORG_ID
    else:
        org_id = organization_id

    result = await db.execute(
        select(Project)
        .where(Project.organization_id == org_id)
        .order_by(Project.created_at.desc())
    )
    projects: List[Project] = result.scalars().all()

    # For o MVP, ainda não ligamos a tabela de repositórios do Supabase,
    # então retornamos apenas o nome do projeto e `repo` opcionalmente
    # inferido da descrição no futuro. Por enquanto, sem repo.
    return [_serialize_project_with_repo(p, None) for p in projects]


class ProjectCreatePayload(BaseModel):  # type: ignore[name-defined]
    """
    Payload used by the auth_flow.html front to register a new project.

    Example:
        {
          "name": "api-gateway",
          "github_repo": "owner/api-gateway"
        }
    """

    name: str
    github_repo: str
    description: Optional[str] = None
    organization_id: Optional[UUID] = None


@router.post("/", status_code=201)
async def create_project(
    payload: ProjectCreatePayload,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new project and attach the given GitHub repository.

    Implementation notes:
    - If organization_id is omitted, we attach the project to the default org.
    - We parse `github_repo` in the form "owner/name".
    - Returned JSON is already shaped for the current React UI.
    - Returns HTTP 409 if a project with the same name already exists in the org.
    """
    # Resolve organization
    if payload.organization_id is None:
        org = await _ensure_default_org(db)
    else:
        result = await db.execute(
            select(Organization).where(Organization.id == payload.organization_id)
        )
        org = result.scalar_one_or_none()
        if not org:
            raise HTTPException(status_code=404, detail="Organização não encontrada.")

    # ── Duplicate check ─────────────────────────────────────────────────────
    existing = await db.execute(
        select(Project)
        .where(Project.organization_id == org.id)
        .where(Project.name == payload.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Já existe um projeto com o nome '{payload.name}' nessa organização.",
        )

    project = Project(
        organization_id=org.id,
        name=payload.name,
        description=payload.description,
        health_status="unknown",
        created_at=datetime.utcnow(),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    return _serialize_project_with_repo(project, payload.github_repo or None)


@router.delete("/{project_id}", status_code=200)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a project by ID.
    Returns the deleted project data so the UI can update its list optimistically.
    """
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")

    serialized = _serialize_project_with_repo(project, None)
    await db.delete(project)
    await db.commit()
    return {"deleted": True, "project": serialized}


@router.post("/{project_id}/analyse", status_code=200)
async def analyse_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger a new analysis run for a project.
    For the MVP, this acts as a stub that simulates a quick analysis run.
    """
    import asyncio
    
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")

    # Simulando tempo de re-análise da IA
    await asyncio.sleep(1.5)

    # Return something indicating success
    return {
        "status": "success",
        "message": "Análise concluída com sucesso.",
        "project_id": str(project_id)
    }

