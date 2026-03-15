"""
Jira endpoints — interact with connected Jira instance.
"""
import httpx
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from uuid import UUID

from app.services.jira_service import JiraService
from app.core.database import get_db
from app.models.models import JiraProject
from app.schemas.schemas import JiraProjectCreate, JiraProjectResponse
from app.core.crypto import encrypt_token, decrypt_token

router = APIRouter()


def _build_jira_service(jira_project: JiraProject) -> JiraService:
    """Instantiate JiraService from a JiraProject DB record."""
    token = decrypt_token(jira_project.jira_api_token_encrypted) if jira_project.jira_api_token_encrypted else None
    return JiraService(
        base_url=jira_project.jira_url,
        email=jira_project.jira_email,
        api_token=token,
    )


async def _get_jira_service(jira_project_id: UUID, db: AsyncSession) -> JiraService:
    """Fetch JiraProject from DB and return its service. Raises 404 if not found."""
    result = await db.execute(select(JiraProject).where(JiraProject.id == jira_project_id))
    jira_project = result.scalar_one_or_none()
    if not jira_project:
        raise HTTPException(status_code=404, detail="Integração Jira não encontrada.")
    return _build_jira_service(jira_project)


def _handle_jira_http_error(e: httpx.HTTPStatusError) -> HTTPException:
    """Map a Jira API HTTP error to a meaningful FastAPI HTTPException."""
    status = e.response.status_code
    if status == 401:
        return HTTPException(status_code=401, detail="Credenciais Jira inválidas ou expiradas.")
    if status == 403:
        return HTTPException(status_code=403, detail="Sem permissão para acessar este recurso no Jira.")
    if status == 404:
        return HTTPException(status_code=404, detail="Recurso não encontrado no Jira.")
    return HTTPException(status_code=502, detail=f"Erro na API do Jira ({status}): {e.response.text}")


# ---------------------------------------------------------------------------
# POST /jira/  — Link a Jira project to an internal project
# ---------------------------------------------------------------------------

@router.post("/", response_model=JiraProjectResponse, status_code=201)
async def map_jira_project(
    jira_data: JiraProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    """Link a Jira project and its credentials to an internal ProjectPulse project."""
    try:
        encrypted_token = encrypt_token(jira_data.jira_api_token) if jira_data.jira_api_token else None

        new_jira_project = JiraProject(
            project_id=jira_data.project_id,
            jira_key=jira_data.jira_key,
            jira_url=jira_data.jira_url,
            jira_email=jira_data.jira_email,
            jira_api_token_encrypted=encrypted_token,
            auth_type="basic",
        )

        db.add(new_jira_project)
        await db.commit()
        await db.refresh(new_jira_project)
        return new_jira_project

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /jira/{jira_project_id}/test-connection
# ---------------------------------------------------------------------------

@router.get("/{jira_project_id}/test-connection")
async def test_jira_integration(
    jira_project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Test the connected Jira credentials by fetching the authenticated user profile."""
    try:
        jira_service = await _get_jira_service(jira_project_id, db)
        user_data = await jira_service.test_connection()
        return {"status": "ok", "message": f"Autenticado como: {user_data.get('displayName')}"}
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise _handle_jira_http_error(e)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /jira/{jira_project_id}/projects
# ---------------------------------------------------------------------------

@router.get("/{jira_project_id}/projects", response_model=list[dict[str, Any]])
async def list_all_jira_projects(
    jira_project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all projects available in this specific Jira instance."""
    try:
        jira_service = await _get_jira_service(jira_project_id, db)
        return await jira_service.get_all_projects()
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise _handle_jira_http_error(e)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /jira/{jira_project_id}/projects/{project_key}
# ---------------------------------------------------------------------------

@router.get("/{jira_project_id}/projects/{project_key}", response_model=dict[str, Any])
async def get_jira_project_details(
    jira_project_id: UUID,
    project_key: str,
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific Jira project."""
    try:
        jira_service = await _get_jira_service(jira_project_id, db)
        return await jira_service.get_project(project_key)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise _handle_jira_http_error(e)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /jira/{jira_project_id}/projects/{project_key}/issues
# ---------------------------------------------------------------------------

@router.get("/{jira_project_id}/projects/{project_key}/issues", response_model=list[dict[str, Any]])
async def get_jira_project_issues(
    jira_project_id: UUID,
    project_key: str,
    max_results: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Fetch recent issues for a specific Jira project."""
    try:
        jira_service = await _get_jira_service(jira_project_id, db)
        return await jira_service.get_project_issues(project_key, max_results=max_results)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise _handle_jira_http_error(e)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /jira/{jira_project_id}/projects/{project_key}/blocked
# ---------------------------------------------------------------------------

@router.get("/{jira_project_id}/projects/{project_key}/blocked", response_model=list[dict[str, Any]])
async def get_jira_blocked_issues(
    jira_project_id: UUID,
    project_key: str,
    max_results: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Fetch potential blocked issues for a specific Jira project."""
    try:
        jira_service = await _get_jira_service(jira_project_id, db)
        return await jira_service.get_blocked_issues(project_key, max_results=max_results)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise _handle_jira_http_error(e)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
