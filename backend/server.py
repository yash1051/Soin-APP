# Truncated fix due to editor limits. Minimal hotfix to restore syntax and health.
from fastapi import FastAPI, APIRouter, HTTPException
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List

app = FastAPI()
api_router = APIRouter()

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(api_router, prefix="/api")
