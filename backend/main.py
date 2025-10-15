"""
Mo7ami Legal Chatbot - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from loguru import logger
import sys

from app.api import chat, voice, documents, realtime
from app.core.config import settings
from app.core.database import init_db

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL,
)
logger.add(
    settings.LOG_FILE,
    rotation="500 MB",
    retention="10 days",
    level=settings.LOG_LEVEL,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("🚀 Starting Mo7ami Backend API")
    await init_db()
    logger.info("✅ Database initialized")
    yield
    logger.info("👋 Shutting down Mo7ami Backend API")


# Initialize FastAPI app
app = FastAPI(
    title="Mo7ami Legal Chatbot API",
    description="AI-powered legal chatbot for Moroccan law with RAG and voice capabilities",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Mo7ami Legal Chatbot API",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return JSONResponse(
        content={
            "status": "healthy",
            "api_version": "0.1.0",
            "services": {
                "database": "connected",
                "vector_store": "ready",
                "llm": "ready",
            },
        }
    )


# Include routers
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["Voice"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(realtime.router, prefix="/api/v1/realtime", tags=["Realtime Voice"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
