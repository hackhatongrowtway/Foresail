"""
API v1 Router — aggregates all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import jira

api_router = APIRouter()

api_router.include_router(jira.router, prefix="/jira", tags=["jira"])
