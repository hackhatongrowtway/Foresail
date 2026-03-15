"""
Ingestion Endpoints — orchestrate Jira and GitHub data synchronization to the DB.
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any
import asyncio
from httpx import HTTPStatusError

from app.core.database import get_db
from app.models.models import IngestionRun, Ticket, Commit, Project, Repository, JiraProject
from app.schemas.schemas import IngestionRunResponse
from app.api.v1.endpoints.jira import _get_jira_service
from app.services.github_service import GitHubService

router = APIRouter()

# ---------------------------------------------------------------------------
# GET /ingestions
# ---------------------------------------------------------------------------
@router.get("/", response_model=List[IngestionRunResponse])
async def list_ingestions(db: AsyncSession = Depends(get_db)):
    """Fetch history of ingestion runs for the dashboard panel."""
    result = await db.execute(
        select(IngestionRun).order_by(IngestionRun.started_at.desc()).limit(100)
    )
    return result.scalars().all()


# ---------------------------------------------------------------------------
# POST /ingestions/sync/{project_id}
# ---------------------------------------------------------------------------
@router.post("/sync/{project_id}", response_model=IngestionRunResponse)
async def trigger_sync(
    project_id: uuid.UUID,
    source: str = "all", # 'github', 'jira', or 'all'
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger a synchronization for the given project.
    In MVP this is synchronous, but realistically should be a background task (e.g. Celery).
    """
    project_result = await db.execute(
        select(Project)
        .options(selectinload(Project.jira_projects))
        .options(selectinload(Project.repositories))
        .where(Project.id == project_id)
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")

    if source not in ["github", "jira", "all"]:
        raise HTTPException(status_code=400, detail="Source must be 'github', 'jira', or 'all'.")

    run = IngestionRun(
        project_id=project_id,
        source=source,
        status="running",
        started_at=datetime.utcnow(),
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    # Note: Using asyncio.create_task to run this in the background without blocking the HTTP response
    # For a robust production app, use Redis/Celery. For this Hackathon, background tasks work well.
    asyncio.create_task(_run_sync_pipeline(run.id, project, db))

    return run


async def _run_sync_pipeline(run_id: uuid.UUID, project: Project, db: AsyncSession):
    """Background task to fetch all connected sources and write to DB."""
    # We need a new session for the background task
    async for background_db in get_db():
        try:
            # Re-fetch the run using the background session
            run_result = await background_db.execute(select(IngestionRun).where(IngestionRun.id == run_id))
            run = run_result.scalar_one()

            total_events = 0
            logs = []
            
            # --- 1. JIRA INGESTION ---
            if run.source in ["jira", "all"]:
                for jira_proj in project.jira_projects:
                    logs.append({"time": datetime.utcnow().strftime("%H:%M:%S"), "level": "INFO", "msg": f"Iniciando ingestão Jira para {jira_proj.jira_key}"})
                    try:
                        jira_service = await _get_jira_service(jira_proj.id, background_db)
                        issues = await jira_service.get_project_issues(jira_proj.jira_key, max_results=50)
                        
                        for issue in issues:
                            # Simplistic Upsert
                            existing = await background_db.execute(
                                select(Ticket).where(Ticket.external_id == issue["key"])
                            )
                            if not existing.scalar_one_or_none():
                                ticket = Ticket(
                                    project_id=project.id,
                                    source="jira",
                                    external_id=issue["key"],
                                    title=issue["fields"]["summary"],
                                    status=issue["fields"]["status"]["name"],
                                    author=issue["fields"].get("creator", {}).get("displayName", "Unknown"),
                                    metadata_json=issue,
                                )
                                background_db.add(ticket)
                                total_events += 1

                        logs.append({"time": datetime.utcnow().strftime("%H:%M:%S"), "level": "INFO", "msg": f"Ingeridos {total_events} tickets do Jira."})
                    
                    except Exception as e:
                        msg = str(e)
                        if isinstance(e, HTTPStatusError):
                            msg = f"HTTP {e.response.status_code} - {e.response.text}"
                        logs.append({"time": datetime.utcnow().strftime("%H:%M:%S"), "level": "ERROR", "msg": f"Erro Jira: {msg[:100]}"})
                        run.errors_count += 1

            # --- 2. GITHUB INGESTION ---
            if run.source in ["github", "all"]:
                github_svc = GitHubService()
                for repo in project.repositories:
                    logs.append({"time": datetime.utcnow().strftime("%H:%M:%S"), "level": "INFO", "msg": f"Iniciando ingestão GitHub para {repo.repo_owner}/{repo.repo_name}"})
                    try:
                        events_before = total_events
                        # Commits
                        commits = await github_svc.get_commits(repo.repo_owner, repo.repo_name, per_page=15)
                        for c in commits:
                            existing = await background_db.execute(select(Commit).where(Commit.commit_hash == c["sha"]))
                            if not existing.scalar_one_or_none():
                                author = c["commit"]["author"]["name"] if c["commit"]["author"] else "Unknown"
                                commit_rec = Commit(
                                    project_id=project.id,
                                    repository_id=repo.id,
                                    commit_hash=c["sha"],
                                    message=c["commit"]["message"],
                                    author=author,
                                )
                                background_db.add(commit_rec)
                                total_events += 1
                        
                        # Pull Requests
                        prs = await github_svc.get_pull_requests(repo.repo_owner, repo.repo_name, per_page=15)
                        for pr in prs:
                            external_id = f"PR#{pr['number']}"
                            existing = await background_db.execute(select(Ticket).where(Ticket.external_id == external_id))
                            if not existing.scalar_one_or_none():
                                ticket = Ticket(
                                    project_id=project.id,
                                    source="github_pr",
                                    external_id=external_id,
                                    title=pr["title"],
                                    status=pr["state"],
                                    author=pr["user"]["login"] if pr["user"] else "Unknown",
                                    metadata_json=pr,
                                )
                                background_db.add(ticket)
                                total_events += 1
                                
                        logs.append({"time": datetime.utcnow().strftime("%H:%M:%S"), "level": "INFO", "msg": f"Ingeridos {total_events - events_before} itens do GitHub."})

                    except Exception as e:
                        msg = str(e)
                        if isinstance(e, HTTPStatusError):
                            msg = f"HTTP {e.response.status_code} - {e.response.text}"
                        logs.append({"time": datetime.utcnow().strftime("%H:%M:%S"), "level": "ERROR", "msg": f"Erro GitHub: {msg[:100]}"})
                        run.errors_count += 1
            
            # Finalize run
            run.status = "error" if run.errors_count > 0 else "success"
            run.events_count = total_events
            run.error_logs = logs
            run.completed_at = datetime.utcnow()
            
            await background_db.commit()

        except Exception as e:
            # Hard crash catch
            run_result = await background_db.execute(select(IngestionRun).where(IngestionRun.id == run_id))
            run = run_result.scalar_one()
            run.status = "error"
            run.error_logs = [{"time": datetime.utcnow().strftime("%H:%M:%S"), "level": "CRITICAL", "msg": str(e)}]
            run.errors_count += 1
            await background_db.commit()
            print(f"CRITICAL Ingestion Error: {e}")
            
        finally:
            break # Ensure generator is consumed correctly
