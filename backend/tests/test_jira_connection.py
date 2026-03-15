"""
Temporary connection test — validates Jira API credentials (Legacy ENV method).
Run: python -m pytest tests/test_jira_connection.py -v -s
"""
import asyncio
import pytest
import pytest_asyncio
from dotenv import load_dotenv

# Load .env before any app imports
load_dotenv()

@pytest.mark.asyncio
async def test_jira_connection():
    """Verify Jira API credentials are valid and can fetch basic info."""
    from app.services.jira_service import JiraService
    from app.core.config import get_settings

    # Reload settings to ensure .env changes are picked up
    get_settings.cache_clear()
    settings = get_settings()

    assert settings.JIRA_BASE_URL, "JIRA_BASE_URL is not set"
    assert settings.JIRA_EMAIL, "JIRA_EMAIL is not set"
    assert settings.JIRA_API_TOKEN, "JIRA_API_TOKEN is not set"

    print(f"\nConfigurações lidas: {settings.JIRA_BASE_URL} | {settings.JIRA_EMAIL}")

    jira_service = JiraService(
        base_url=settings.JIRA_BASE_URL,
        email=settings.JIRA_EMAIL,
        api_token=settings.JIRA_API_TOKEN
    )

    # Simple query to check authentication: Get current user
    # This endpoint just validates who we are logged in as
    import httpx
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{jira_service.base_url}/rest/api/3/myself",
                auth=jira_service.auth,
                headers=jira_service.headers,
            )
            response.raise_for_status()
            user_data = response.json()

            print(f"\nConexão com Jira bem sucedida!")
            print(f"   Usuário autenticado: {user_data.get('displayName')} ({user_data.get('emailAddress')})")
            assert True
        except httpx.HTTPStatusError as e:
            print(f"\nErro de Autenticação/Status: {e.response.status_code}")
            print(f"   Detalhes: {e.response.text}")
            pytest.fail(f"HTTP Error: {e.response.status_code}")
        except Exception as e:
            print(f"\nErro de Conexão: {e}")
            pytest.fail(f"Connection Error: {e}")
