"""
Jira Service — interact with Jira REST API to collect project data.
"""
import httpx
from httpx import BasicAuth
from app.core.config import get_settings

settings = get_settings()

class JiraService:
    """Service to fetch data from Jira REST API."""

    def __init__(self, base_url: str | None = None, email: str | None = None, api_token: str | None = None):
        self.base_url = (base_url or settings.JIRA_BASE_URL).rstrip('/')
        self.email = email or settings.JIRA_EMAIL
        self.api_token = api_token or settings.JIRA_API_TOKEN
        
        self.auth = BasicAuth(self.email, self.api_token)
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

    async def get_all_projects(self) -> list[dict]:
        """List all projects visible to the authenticated user."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rest/api/3/project",
                auth=self.auth,
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    async def get_project(self, project_key: str) -> dict:
        """Get details for a specific project by key (e.g., 'PROJ')."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rest/api/3/project/{project_key}",
                auth=self.auth,
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    async def search_issues(self, jql: str, start_at: int = 0, max_results: int = 50) -> dict:
        """Search issues using JQL."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rest/api/3/search",
                params={
                    "jql": jql,
                    "startAt": start_at,
                    "maxResults": max_results,
                    "fields": "summary,status,assignee,created,updated,description,priority,issuetype"
                },
                auth=self.auth,
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    async def get_project_issues(self, project_key: str, max_results: int = 50) -> list[dict]:
        """Fetch recent or open issues for a specific project."""
        jql = f"project = {project_key} ORDER BY updated DESC"
        result = await self.search_issues(jql, max_results=max_results)
        return result.get("issues", [])

    async def get_blocked_issues(self, project_key: str, max_results: int = 50) -> list[dict]:
        """
        Fetch issues that might be blocked. 
        Adjust the JQL based on how 'blocked' is defined in the specific Jira instance.
        Often it's a specific status category or a link type.
        """
        # Example JQL - might need adjustment based on the Jira setup
        jql = f"project = {project_key} AND status = Blocked ORDER BY updated DESC"
        try:
            result = await self.search_issues(jql, max_results=max_results)
            return result.get("issues", [])
        except httpx.HTTPStatusError as e:
             # Just in case 'Blocked' status doesn't exist, we return empty
             # A more robust approach would query statuses first
             print(f"Failed to fetch blocked issues (maybe status doesn't exist?): {e}")
             return []
