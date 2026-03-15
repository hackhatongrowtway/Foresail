"""
Temporary connection test — validates GitHub API credentials.
Run: python -m pytest tests/test_github_connection.py -v -s
"""
import pytest
from dotenv import load_dotenv

# Load .env before any app imports
load_dotenv()

@pytest.mark.asyncio
async def test_github_connection():
    """Verify GitHub API credentials are valid and can fetch basic user info."""
    from app.services.github_service import GitHubService
    from app.core.config import get_settings
    
    # Reload settings to ensure .env changes are picked up
    get_settings.cache_clear()
    settings = get_settings()
    
    assert settings.GITHUB_TOKEN, "GITHUB_TOKEN is not set in .env"
    
    print(f"\nConfigurações lidas: GITHUB_TOKEN={settings.GITHUB_TOKEN[:10]}...")
    
    github_service = GitHubService()
    
    try:
        user_data = await github_service.get_current_user()
        
        print(f"\nConexão com GitHub bem sucedida!")
        print(f"   Usuário autenticado: {user_data.get('login')} (Nome: {user_data.get('name')})")
        assert True
    except Exception as e:
        print(f"\nErro de Conexão com GitHub: {e}")
        pytest.fail(f"Connection Error: {e}")
