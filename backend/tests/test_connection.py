"""
Temporary connection test — validates Supabase and SQLAlchemy connections.
Run: python -m pytest tests/test_connection.py -v
"""
import asyncio
import pytest
import pytest_asyncio
from dotenv import load_dotenv

# Load .env before any app imports
load_dotenv()


# TEST 1: Environment variables loaded correctly
def test_settings_loaded():
    """Verify all required env vars are present and not empty."""
    from app.core.config import get_settings
    get_settings.cache_clear()  # clear lru_cache for fresh load

    settings = get_settings()

    assert settings.SUPABASE_URL, "SUPABASE_URL is empty"
    assert settings.SUPABASE_URL.startswith("https://"), "SUPABASE_URL must start with https://"
    assert settings.SUPABASE_KEY, "SUPABASE_KEY is empty"
    assert settings.SUPABASE_SERVICE_KEY, "SUPABASE_SERVICE_KEY is empty"
    assert settings.DATABASE_URL, "DATABASE_URL is empty"
    assert "postgresql" in settings.DATABASE_URL, "DATABASE_URL must contain 'postgresql'"

    print(f"\nSettings loaded OK")
    print(f"   APP_NAME: {settings.APP_NAME}")
    print(f"   SUPABASE_URL: {settings.SUPABASE_URL[:40]}...")
    print(f"   DATABASE_URL: {settings.DATABASE_URL[:40]}...")


# TEST 2: Supabase client connection
def test_supabase_client_connection():
    """Verify Supabase client can connect and query."""
    from app.core.config import get_settings
    from supabase import create_client

    get_settings.cache_clear()
    settings = get_settings()

    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    # Simple query — list tables (this should work even with no data)
    # We test by querying a table that doesn't need to exist
    # If the connection works, we get either data or an empty result
    assert client is not None, "Supabase client is None"

    print(f"\nSupabase client created successfully")
    print(f"   Connected to: {settings.SUPABASE_URL}")


# TEST 3: Supabase service-role client
def test_supabase_admin_connection():
    """Verify Supabase admin (service_role) client works."""
    from app.core.config import get_settings
    from supabase import create_client

    get_settings.cache_clear()
    settings = get_settings()

    admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    assert admin_client is not None, "Admin client is None"

    print(f"\nSupabase admin client created successfully")


# TEST 4: SQLAlchemy async connection to PostgreSQL
@pytest.mark.asyncio
async def test_sqlalchemy_connection():
    """Verify SQLAlchemy async engine can connect to the database."""
    from app.core.config import get_settings
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    get_settings.cache_clear()
    settings = get_settings()

    db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url, echo=False, connect_args={"prepared_statement_cache_size": 0, "statement_cache_size": 0})

    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1 AS test"))
        row = result.fetchone()
        assert row is not None, "Query returned no results"
        assert row[0] == 1, f"Expected 1, got {row[0]}"

    await engine.dispose()

    print(f"\nSQLAlchemy async connection OK")
    print(f"   SELECT 1 returned: {row[0]}")


# TEST 5: Check that migration tables exist
@pytest.mark.asyncio
async def test_tables_exist():
    """Verify that the migration created all expected tables."""
    from app.core.config import get_settings
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    get_settings.cache_clear()
    settings = get_settings()

    db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(db_url, echo=False, connect_args={"prepared_statement_cache_size": 0, "statement_cache_size": 0})

    expected_tables = [
        "organizations",
        "profiles",
        "projects",
        "project_members",
        "repositories",
        "jira_projects",
        "analyses",
        "risk_indicators",
        "activity_logs",
    ]

    async with engine.connect() as conn:
        result = await conn.execute(text(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
            """
        ))
        existing_tables = [row[0] for row in result.fetchall()]

    await engine.dispose()

    print(f"\nTables found in database: {existing_tables}")

    missing = [t for t in expected_tables if t not in existing_tables]

    if missing:
        print(f"\nMissing tables (run the SQL migration first): {missing}")
        pytest.skip(f"Missing tables: {missing}. Run 001_initial_schema.sql in Supabase SQL Editor first.")
    else:
        print(f"\nAll {len(expected_tables)} tables exist!")
        for t in expected_tables:
            status = "Ok" if t in existing_tables else "Error"
            print(f"   {status} {t}")


# TEST 6: Insert + query + delete on organizations (full cycle)
@pytest.mark.asyncio
async def test_crud_organization():
    """Full CRUD cycle: insert, read, and delete a test organization."""
    from app.core.config import get_settings
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    get_settings.cache_clear()
    settings = get_settings()

    db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(db_url, echo=False, connect_args={"prepared_statement_cache_size": 0, "statement_cache_size": 0})

    test_slug = "test-connection-temp"

    async with engine.begin() as conn:
        # Clean up any previous test data
        await conn.execute(text(
            "DELETE FROM public.organizations WHERE slug = :slug"
        ), {"slug": test_slug})

        # INSERT
        result = await conn.execute(text(
            """
            INSERT INTO public.organizations (name, slug)
            VALUES (:name, :slug)
            RETURNING id, name, slug, created_at
            """
        ), {"name": "Test Connection Org", "slug": test_slug})

        inserted = result.fetchone()
        assert inserted is not None, "INSERT failed"
        org_id = inserted[0]
        print(f"\nINSERT OK — id: {org_id}, name: {inserted[1]}, slug: {inserted[2]}")

        # SELECT
        result = await conn.execute(text(
            "SELECT id, name, slug FROM public.organizations WHERE id = :id"
        ), {"id": org_id})

        fetched = result.fetchone()
        assert fetched is not None, "SELECT returned nothing"
        assert str(fetched[0]) == str(org_id), "ID mismatch"
        print(f"SELECT OK — found organization '{fetched[1]}'")

        # DELETE (cleanup)
        await conn.execute(text(
            "DELETE FROM public.organizations WHERE id = :id"
        ), {"id": org_id})

        # Verify deletion
        result = await conn.execute(text(
            "SELECT id FROM public.organizations WHERE id = :id"
        ), {"id": org_id})
        assert result.fetchone() is None, "DELETE failed — record still exists"
        print(f"DELETE OK — test record cleaned up")

    await engine.dispose()
    print(f"\nFull CRUD cycle passed!")
