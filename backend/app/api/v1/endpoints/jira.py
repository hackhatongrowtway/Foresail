"""
Jira endpoints — interact with connected Jira instance.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.services.jira_service import JiraService
from app.core.database import get_db
from app.models.models import JiraProject
from app.schemas.schemas import JiraProjectCreate, JiraProjectResponse
from app.core.crypto import encrypt_token, decrypt_token

router = APIRouter()


def get_jira_service(jira_project: JiraProject) -> JiraService:
    """Dependency alternative: initialize JiraService from DB instead of ENV."""
    token = None
    if jira_project.jira_api_token_encrypted:
        token = decrypt_token(jira_project.jira_api_token_encrypted)
        
    return JiraService(
        base_url=jira_project.jira_url,
        email=jira_project.jira_email,
        api_token=token
    )

@router.post("/", response_model=JiraProjectResponse)
async def map_jira_project(
    project_id: UUID,
    jira_data: JiraProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    """Link a Jira project and its credentials to an internal ProjectPulse project."""
    try:
        # Encrypt the token before saving
        encrypted_token = None
        if jira_data.jira_api_token:
            encrypted_token = encrypt_token(jira_data.jira_api_token)

        new_jira_project = JiraProject(
            project_id=project_id,
            jira_key=jira_data.jira_key,
            jira_url=jira_data.jira_url,
            jira_email=jira_data.jira_email,
            jira_api_token_encrypted=encrypted_token,
            auth_type="basic"
        )
        
        db.add(new_jira_project)
        await db.commit()
        await db.refresh(new_jira_project)
        
        return new_jira_project
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


async def fetch_jira_service_from_db(jira_project_id: UUID, db: AsyncSession) -> JiraService:
    """Helper to fetch a JiraProject by ID and construct its service."""
    from sqlalchemy import select
    result = await db.execute(select(JiraProject).where(JiraProject.id == jira_project_id))
    jira_project = result.scalar_one_or_none()
    if not jira_project:
        raise HTTPException(status_code=404, detail="Integração Jira não encontrada.")
    return get_jira_service(jira_project)


@router.get("/{jira_project_id}/test-connection")
async def test_jira_integration(
    jira_project_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Test the connected Jira credentials by fetching my user profile."""
    try:
        jira_service = await fetch_jira_service_from_db(jira_project_id, db)
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{jira_service.base_url}/rest/api/3/myself",
                auth=jira_service.auth,
                headers=jira_service.headers,
            )
            response.raise_for_status()
            user_data = response.json()
            return {"status": "ok", "message": f"Autenticado como: {user_data.get('displayName')}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro de conexão com Jira: {str(e)}")


@router.get("/{jira_project_id}/projects", response_model=list[dict[str, Any]])
async def list_all_jira_projects(
    jira_project_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """List all projects available in this specific Jira instance."""
    try:
        jira_service = await fetch_jira_service_from_db(jira_project_id, db)
        projects = await jira_service.get_all_projects()
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{jira_project_id}/projects/{project_key}", response_model=dict[str, Any])
async def get_jira_project_details(
    jira_project_id: UUID,
    project_key: str,
    db: AsyncSession = Depends(get_db)
):
    """Get details of a specific Jira project."""
    try:
        jira_service = await fetch_jira_service_from_db(jira_project_id, db)
        project = await jira_service.get_project(project_key)
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{jira_project_id}/projects/{project_key}/issues", response_model=list[dict[str, Any]])
async def get_jira_project_issues(
    jira_project_id: UUID,
    project_key: str,
    max_results: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Fetch recent issues for a specific Jira project using stored credentials."""
    try:
        jira_service = await fetch_jira_service_from_db(jira_project_id, db)
        issues = await jira_service.get_project_issues(project_key, max_results=max_results)
        return issues
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{jira_project_id}/projects/{project_key}/blocked", response_model=list[dict[str, Any]])
async def get_jira_blocked_issues(
    jira_project_id: UUID,
    project_key: str,
    max_results: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Fetch potential blocked issues for a specific Jira project."""
    try:
        jira_service = await fetch_jira_service_from_db(jira_project_id, db)
        issues = await jira_service.get_blocked_issues(project_key, max_results=max_results)
        return issues
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
