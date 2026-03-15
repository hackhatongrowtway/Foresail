"""
API v1 Router — aggregates all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import jira, github, ingestions, projects

api_router = APIRouter()

api_router.include_router(jira.router, prefix="/jira", tags=["jira"])
api_router.include_router(github.router, prefix="/github", tags=["github"])
api_router.include_router(ingestions.router, prefix="/ingestions", tags=["ingestions"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
