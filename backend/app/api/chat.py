"""Chat endpoint implementation with persistent conversation storage."""

from __future__ import annotations

from datetime import datetime, timezone
from time import perf_counter
from typing import List, Optional, Tuple
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.core.database import get_db
from app.models import Conversation, Message, QueryAnalytics
from app.services.generation import generate_answer, extract_citations
from app.services.generation_stream import generate_answer_stream
from app.services.retrieval import retrieve_relevant_documents

router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message model"""

    role: str  # user or assistant
    content: str
    language: Optional[str] = "ar"


class ChatRequest(BaseModel):
    """Chat request model"""

    message: str
    language: Optional[str] = "ar"
    conversation_id: Optional[str] = None
    voice_input: bool = False
    user_id: Optional[str] = None
    client_token: Optional[str] = None


class Citation(BaseModel):
    """Citation model"""

    source: str
    article: Optional[str] = None
    reference: str
    url: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response model"""

    answer: str
    language: str
    citations: List[Citation]
    conversation_id: str
    processing_time: float
    remaining_questions: int
    daily_limit: int


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Main chat endpoint - processes user query and returns AI response with citations
    """
    query_language = request.language or "ar"
    user_id = request.user_id
    client_token = request.client_token or user_id

    if not client_token:
        raise HTTPException(status_code=400, detail="Missing client identifier")

    logger.info(
        "Received chat request in %s for user %s / client %s: %s...",
        query_language,
        user_id or "anonymous",
        client_token,
        request.message[:80],
    )

    process_start = perf_counter()
    limit, remaining_before = await _check_usage_limit(
        db=db,
        user_id=user_id,
        client_token=client_token,
    )

    conversation = await _resolve_conversation(
        db=db,
        conversation_id=request.conversation_id,
        user_id=user_id,
        client_token=client_token,
        language=query_language,
    )

    try:
        user_message = Message(
            id=str(uuid4()),
            conversation_id=conversation.id,
            role="user",
            content=request.message.strip(),
            language=query_language,
            citations=None,
            voice_used=request.voice_input,
        )
        db.add(user_message)
        await db.flush()

        relevant_docs = await retrieve_relevant_documents(
            db=db,
            query=request.message,
            language=query_language,
            top_k=5,
        )

        answer, citations = await generate_answer(
            query=request.message,
            documents=relevant_docs,
            language=query_language,
        )

        assistant_message = Message(
            id=str(uuid4()),
            conversation_id=conversation.id,
            role="assistant",
            content=answer,
            language=query_language,
            citations=citations,
            voice_used=False,
        )
        db.add(assistant_message)

        processing_time = perf_counter() - process_start
        await _record_analytics(
            db,
            query=request.message,
            language=query_language,
            duration_seconds=processing_time,
            voice_used=request.voice_input,
            successful=True,
            user_id=user_id,
            client_token=client_token,
        )

        remaining_after = max(remaining_before - 1, 0)
        response = ChatResponse(
            answer=answer,
            language=query_language,
            citations=citations,
            conversation_id=conversation.id,
            processing_time=processing_time,
            remaining_questions=remaining_after,
            daily_limit=limit,
        )

        logger.info(
            "Responded to conversation %s in %.2fs with %s citations",
            conversation.id,
            processing_time,
            len(citations),
        )
        return response

    except Exception as error:
        await _record_analytics(
            db,
            query=request.message,
            language=query_language,
            duration_seconds=perf_counter() - process_start,
            voice_used=request.voice_input,
            successful=False,
            user_id=user_id,
            client_token=client_token,
        )
        logger.exception("Chat processing failed: %s", error)
        raise HTTPException(status_code=500, detail="Failed to process request")


@router.post("/stream")
async def chat_stream(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Streaming chat endpoint - returns Server-Sent Events with real-time text generation
    """
    query_language = request.language or "ar"
    user_id = request.user_id
    client_token = request.client_token or user_id

    if not client_token:
        raise HTTPException(status_code=400, detail="Missing client identifier")

    logger.info(
        "Received streaming chat request in %s for user %s / client %s: %s...",
        query_language,
        user_id or "anonymous",
        client_token,
        request.message[:80],
    )

    process_start = perf_counter()
    limit, remaining_before = await _check_usage_limit(
        db=db,
        user_id=user_id,
        client_token=client_token,
    )

    conversation = await _resolve_conversation(
        db=db,
        conversation_id=request.conversation_id,
        user_id=user_id,
        client_token=client_token,
        language=query_language,
    )

    async def event_stream():
        """Generate Server-Sent Events stream"""
        try:
            # Save user message
            user_message = Message(
                id=str(uuid4()),
                conversation_id=conversation.id,
                role="user",
                content=request.message.strip(),
                language=query_language,
                citations=None,
                voice_used=request.voice_input,
            )
            db.add(user_message)
            await db.flush()

            # Retrieve relevant documents
            relevant_docs = await retrieve_relevant_documents(
                db=db,
                query=request.message,
                language=query_language,
                top_k=5,
            )

            # Send citations first
            citations = extract_citations(relevant_docs)
            yield f"data: {json.dumps({'type': 'citations', 'data': citations})}\n\n"

            # Send metadata
            remaining_after = max(remaining_before - 1, 0)
            yield f"data: {json.dumps({'type': 'metadata', 'data': {'conversation_id': conversation.id, 'remaining_questions': remaining_after, 'daily_limit': limit}})}\n\n"

            # Stream the answer
            full_answer = ""
            async for chunk in generate_answer_stream(
                query=request.message,
                documents=relevant_docs,
                language=query_language,
            ):
                full_answer += chunk
                yield f"data: {json.dumps({'type': 'content', 'data': chunk})}\n\n"

            # Save assistant message
            assistant_message = Message(
                id=str(uuid4()),
                conversation_id=conversation.id,
                role="assistant",
                content=full_answer,
                language=query_language,
                citations=citations,
                voice_used=False,
            )
            db.add(assistant_message)

            processing_time = perf_counter() - process_start
            await _record_analytics(
                db,
                query=request.message,
                language=query_language,
                duration_seconds=processing_time,
                voice_used=request.voice_input,
                successful=True,
                user_id=user_id,
                client_token=client_token,
            )

            # Send completion event
            yield f"data: {json.dumps({'type': 'done', 'data': {'processing_time': processing_time}})}\n\n"

            logger.info(
                "Streamed response to conversation %s in %.2fs with %s citations",
                conversation.id,
                processing_time,
                len(citations),
            )

        except Exception as error:
            await _record_analytics(
                db,
                query=request.message,
                language=query_language,
                duration_seconds=perf_counter() - process_start,
                voice_used=request.voice_input,
                successful=False,
                user_id=user_id,
                client_token=client_token,
            )
            logger.exception("Streaming chat processing failed: %s", error)
            yield f"data: {json.dumps({'type': 'error', 'data': 'Failed to process request'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.get("/history")
async def get_conversation_history(user_id: str, db = Depends(get_db)):
    """Get user's conversation history"""
    # TODO: Implement
    return {"conversations": []}


@router.delete("/history/{conversation_id}")
async def delete_conversation(conversation_id: str, db = Depends(get_db)):
    """Delete a conversation"""
    # TODO: Implement
    return {"success": True}


async def _resolve_conversation(
    db: AsyncSession,
    *,
    conversation_id: Optional[str],
    user_id: Optional[str],
    client_token: str,
    language: str,
) -> Conversation:
    """Load an existing conversation or create a new one for this user."""

    if conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
            )
        )
        conversation = result.scalar_one_or_none()
        if conversation:
            if user_id:
                if conversation.user_id == user_id:
                    return conversation
                if conversation.user_id is None and conversation.client_token == client_token:
                    conversation.user_id = user_id
                    await db.flush()
                    return conversation
            else:
                if conversation.client_token == client_token:
                    return conversation
        logger.warning("Conversation %s not found for provided identity", conversation_id)
        raise HTTPException(status_code=404, detail="Conversation not found")

    new_id = str(uuid4())
    conversation = Conversation(
        id=new_id,
        user_id=user_id,
        client_token=client_token,
        language=language,
        title=None,
    )
    db.add(conversation)
    await db.flush()
    return conversation


async def _record_analytics(
    db: AsyncSession,
    *,
    query: str,
    language: str,
    duration_seconds: float,
    voice_used: bool,
    successful: bool,
    user_id: Optional[str],
    client_token: str,
) -> None:
    """Store query analytics for monitoring and compliance."""

    analytics = QueryAnalytics(
        id=str(uuid4()),
        query=query[:500],
        language=language,
        domain=_detect_domain(query),
        response_time_ms=int(duration_seconds * 1000),
        voice_used=voice_used,
        successful=successful,
        user_id=user_id,
        client_token=client_token,
    )
    db.add(analytics)
    await db.flush()


async def _check_usage_limit(
    *,
    db: AsyncSession,
    user_id: Optional[str],
    client_token: str,
) -> Tuple[int, int]:
    """Ensure the caller has remaining quota for the current day."""

    limit = 10 if user_id else 5
    start_of_day = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    stmt = select(func.count()).where(QueryAnalytics.created_at >= start_of_day)
    if user_id:
        stmt = stmt.where(QueryAnalytics.user_id == user_id)
    else:
        stmt = stmt.where(QueryAnalytics.client_token == client_token)

    result = await db.execute(stmt)
    count = result.scalar() or 0

    remaining = limit - count
    if remaining <= 0:
        logger.info(
            "Usage limit reached for user %s / client %s (limit=%s)",
            user_id or "anonymous",
            client_token,
            limit,
        )
        raise HTTPException(
            status_code=429,
            detail={"code": "LIMIT_REACHED", "limit": limit},
        )

    return limit, remaining


def _detect_domain(query: str) -> Optional[str]:
    """Simple keyword-based legal domain detection."""

    lower_query = query.lower()
    domain_keywords = {
        "penal": ["سرقة", "جريمة", "crime", "pénal"],
        "civil": ["عقد", "التزام", "contrat", "civil"],
        "family": ["طلاق", "زواج", "divorce", "famille", "moudawana"],
        "labor": ["عمل", "شغل", "travail", "licenciement"],
        "commercial": ["شركة", "تجارة", "commerce", "faillite"],
        "real_estate": ["عقار", "ملكية", "immobilier", "bail"],
        "tax": ["ضريبة", "impôt", "taxe"],
        "consumer": ["مستهلك", "ضمان", "consommateur"],
    }

    for domain, keywords in domain_keywords.items():
        for keyword in keywords:
            if keyword in lower_query:
                return domain
    return None
