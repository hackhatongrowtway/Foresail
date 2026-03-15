"""
GitHub Service — interact with GitHub API to collect repository data.
"""
from typing import Any, Optional
import httpx
from fastapi import HTTPException

from app.core.config import get_settings

settings = get_settings()

GITHUB_API_BASE = "https://api.github.com"


class GitHubService:
    """Service to fetch data from GitHub API."""

    def __init__(self, token: str | None = None):
        self.token = token or settings.GITHUB_TOKEN
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    async def _get(self, path: str, params: Optional[dict[str, Any]] = None) -> Any:
        """Helper method to execute GET requests with error handling."""
        url = f"{GITHUB_API_BASE}{path}"

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url, headers=self.headers, params=params)
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Timeout ao consultar GitHub.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Erro de rede ao consultar GitHub: {str(e)}")

        if response.status_code >= 400:
            try:
                detail = response.json()
            except Exception:
                detail = response.text
            raise HTTPException(status_code=response.status_code, detail=detail)

        if response.status_code == 202:
            return {
                "status": "processing",
                "message": "GitHub ainda está processando essa estatística."
            }

        return response.json()

    # =========================================================================
    # CORE ENDPOINTS
    # =========================================================================
    
    async def get_current_user(self) -> dict[str, Any]:
        """Get the authenticated user."""
        return await self._get("/user")

    async def get_repo_info(self, owner: str, repo: str) -> dict[str, Any]:
        """Get basic repository information."""
        data = await self._get(f"/repos/{owner}/{repo}")
        return self._map_repository(data)

    async def get_pull_requests(self, owner: str, repo: str, state: str = "all", per_page: int = 30) -> list[dict[str, Any]]:
        """Fetch pull requests from a repository."""
        data = await self._get(f"/repos/{owner}/{repo}/pulls", params={"state": state, "per_page": per_page})
        return [self._map_pull_request(pr) for pr in data]

    async def get_commits(self, owner: str, repo: str, per_page: int = 30) -> list[dict[str, Any]]:
        """Fetch recent commits from a repository."""
        data = await self._get(f"/repos/{owner}/{repo}/commits", params={"per_page": per_page})
        return [self._map_commit(commit) for commit in data]

    async def get_pr_reviews(self, owner: str, repo: str, pr_number: int) -> list[dict[str, Any]]:
        """Fetch reviews for a specific pull request."""
        data = await self._get(f"/repos/{owner}/{repo}/pulls/{pr_number}/reviews")
        return [self._map_review(review) for review in data]

    # =========================================================================
    # MAPPERS (keep properties that matter for AI analysis)
    # =========================================================================

    def _map_repository(self, repo: dict[str, Any]) -> dict[str, Any]:
        return {
            "platform_id": repo.get("id"),
            "owner": repo.get("owner", {}).get("login"),
            "name": repo.get("name"),
            "full_name": repo.get("full_name"),
            "html_url": repo.get("html_url"),
            "default_branch": repo.get("default_branch"),
            "private": repo.get("private"),
            "archived": repo.get("archived"),
            "created_at": repo.get("created_at"),
            "updated_at": repo.get("updated_at"),
            "pushed_at": repo.get("pushed_at"),
        }

    def _map_pull_request(self, pr: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": pr.get("id"),
            "number": pr.get("number"),
            "title": pr.get("title"),
            "state": pr.get("state"),
            "draft": pr.get("draft"),
            "author_login": pr.get("user", {}).get("login"),
            "created_at": pr.get("created_at"),
            "updated_at": pr.get("updated_at"),
            "closed_at": pr.get("closed_at"),
            "merged_at": pr.get("merged_at"),
            "base_ref": pr.get("base", {}).get("ref"),
            "head_ref": pr.get("head", {}).get("ref"),
            "additions": pr.get("additions"),  # Only available on single PR fetch
            "deletions": pr.get("deletions"),  # Only available on single PR fetch
            "changed_files": pr.get("changed_files"),
            "requested_reviewers": [
                reviewer.get("login")
                for reviewer in pr.get("requested_reviewers", [])
            ],
            "html_url": pr.get("html_url"),
        }

    def _map_review(self, review: dict[str, Any]) -> dict[str, Any]:
        return {
            "review_id": review.get("id"),
            "reviewer_login": review.get("user", {}).get("login"),
            "state": review.get("state"),
            "submitted_at": review.get("submitted_at"),
        }

    def _map_commit(self, commit: dict[str, Any]) -> dict[str, Any]:
        return {
            "sha": commit.get("sha"),
            "author_login": (commit.get("author") or {}).get("login"),
            "commit_author_date": ((commit.get("commit") or {}).get("author") or {}).get("date"),
            "commit_message": ((commit.get("commit") or {}).get("message") or "").split("\n")[0],
            "html_url": commit.get("html_url"),
        }
