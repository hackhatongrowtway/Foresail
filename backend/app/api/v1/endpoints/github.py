"""
GitHub endpoints — interact with connected GitHub instances.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Any

from app.services.github_service import GitHubService

router = APIRouter()


def get_github_service() -> GitHubService:
    """Dependency to get GitHubService."""
    return GitHubService()


@router.get("/repos/{owner}/{repo}", response_model=dict[str, Any])
async def get_github_repo_details(
    owner: str = "hackhatongrowtway",
    repo: str = "Foresail",
    github_service: GitHubService = Depends(get_github_service)
):
    """Get details of a specific GitHub repository."""
    try:
        repo_data = await github_service.get_repo_info(owner, repo)
        return repo_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/repos/{owner}/{repo}/pulls", response_model=list[dict[str, Any]])
async def get_github_pull_requests(
    owner: str = "hackhatongrowtway",
    repo: str = "Foresail",
    state: str = Query(default="all", pattern="^(open|closed|all)$"),
    per_page: int = Query(default=30, ge=1, le=100),
    github_service: GitHubService = Depends(get_github_service)
):
    """Fetch pull requests for a specific GitHub repository."""
    try:
        prs = await github_service.get_pull_requests(owner, repo, state, per_page)
        return prs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/repos/{owner}/{repo}/pulls/{pull_number}", response_model=dict[str, Any])
async def get_pull_request_details(
    pull_number: int,
    owner: str = "hackhatongrowtway",
    repo: str = "Foresail",
    github_service: GitHubService = Depends(get_github_service)
):
    """Get details for a single pull request (including additions/deletions)."""
    try:
        # Note: Depending on GitHubService implementation, getting a single PR
        # usually requires hitting /repos/{owner}/{repo}/pulls/{pull_number} directly
        data = await github_service._get(f"/repos/{owner}/{repo}/pulls/{pull_number}")
        return github_service._map_pull_request(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/repos/{owner}/{repo}/pulls/{pull_number}/reviews", response_model=list[dict[str, Any]])
async def get_pull_request_reviews(
    pull_number: int,
    owner: str = "hackhatongrowtway",
    repo: str = "Foresail",
    github_service: GitHubService = Depends(get_github_service)
):
    """Fetch reviews for a specific pull request."""
    try:
        reviews = await github_service.get_pr_reviews(owner, repo, pull_number)
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/repos/{owner}/{repo}/commits", response_model=list[dict[str, Any]])
async def get_github_commits(
    owner: str = "hackhatongrowtway",
    repo: str = "Foresail",
    per_page: int = Query(default=30, ge=1, le=100),
    github_service: GitHubService = Depends(get_github_service)
):
    """Fetch recent commits for a specific GitHub repository."""
    try:
        commits = await github_service.get_commits(owner, repo, per_page)
        return commits
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/repos/{owner}/{repo}/stats/contributors", response_model=list[dict[str, Any]])
async def get_contributors_stats(
    owner: str = "hackhatongrowtway",
    repo: str = "Foresail",
    github_service: GitHubService = Depends(get_github_service)
):
    """Get contributors statistics for a repository."""
    try:
        data = await github_service._get(f"/repos/{owner}/{repo}/stats/contributors")
        if isinstance(data, dict) and data.get("status") == "processing":
            # Return the 202 Accepted response cleanly if GitHub is still crunching numbers
            return [data]
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
