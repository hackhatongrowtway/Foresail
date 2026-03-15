"""
Database connection — SQLAlchemy async engine + Supabase client.
"""
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from supabase import create_client, Client

from app.core.config import get_settings

settings = get_settings()

# SQLAlchemy Async Engine (direct PostgreSQL — for complex queries)
_db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    _db_url,
    echo=settings.DEBUG,
    poolclass=NullPool,
    connect_args={
        "server_settings": {
            "statement_timeout": "30000",
            "idle_in_transaction_session_timeout": "60000",
        },
        # Required for PgBouncer in transaction mode (Supabase connection pooler, port 6543).
        # statement_cache_size=0 disables asyncpg's cache, but asyncpg still creates named
        # prepared statements per query. prepared_statement_name_func with UUID ensures
        # each statement gets a unique name, avoiding DuplicatePreparedStatementError.
        "statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4().hex}__",
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Supabase Client (for Auth, Storage, Realtime, simple CRUD)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
