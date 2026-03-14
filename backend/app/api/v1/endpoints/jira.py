"""
Jira endpoints — interact with connected Jira instance.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Any

from app.services.jira_service import JiraService

router = APIRouter()


def get_jira_service() -> JiraService:
    """Dependency to get JiraService."""
    # In the future, this might fetch credentials from DB for the specific org
    return JiraService()


@router.get("/projects", response_model=list[dict[str, Any]])
async def list_all_jira_projects(
    jira_service: JiraService = Depends(get_jira_service)
):
    """List all projects available in the connected Jira instance."""
    try:
        projects = await jira_service.get_all_projects()
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_key}", response_model=dict[str, Any])
async def get_jira_project_details(
    project_key: str,
    jira_service: JiraService = Depends(get_jira_service)
):
    """Get details of a specific Jira project."""
    try:
        project = await jira_service.get_project(project_key)
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_key}/issues", response_model=list[dict[str, Any]])
async def get_jira_project_issues(
    project_key: str,
    max_results: int = 50,
    jira_service: JiraService = Depends(get_jira_service)
):
    """Fetch recent issues for a specific Jira project."""
    try:
        issues = await jira_service.get_project_issues(project_key, max_results=max_results)
        return issues
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_key}/blocked", response_model=list[dict[str, Any]])
async def get_jira_blocked_issues(
    project_key: str,
    max_results: int = 50,
    jira_service: JiraService = Depends(get_jira_service)
):
    """Fetch potential blocked issues for a specific Jira project."""
    try:
        issues = await jira_service.get_blocked_issues(project_key, max_results=max_results)
        return issues
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
