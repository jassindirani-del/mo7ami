"""
OpenAI Realtime API WebSocket Relay Endpoint

This module provides a WebSocket endpoint that relays bidirectional audio
between the client and OpenAI's Realtime API, while handling function calls
for legal document retrieval (RAG integration).

Architecture:
    Client ←→ FastAPI WebSocket ←→ OpenAI Realtime API
                      ↓
                 Function Calls (RAG)
"""

import asyncio
import json
import os
from typing import Dict, Any, Optional
from loguru import logger
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.responses import JSONResponse
import websockets

from app.core.config import settings
from app.services.retrieval import search_legal_documents
from app.services.generation import generate_answer

router = APIRouter()

# OpenAI Realtime API Configuration
REALTIME_API_URL = "wss://api.openai.com/v1/realtime"
REALTIME_MODEL = os.getenv("OPENAI_REALTIME_MODEL", "gpt-4o-realtime-preview-2024-10-01")
REALTIME_VOICE_AR = os.getenv("REALTIME_VOICE_AR", "shimmer")
REALTIME_VOICE_FR = os.getenv("REALTIME_VOICE_FR", "nova")


# Function definitions for OpenAI to call
LEGAL_FUNCTIONS = [
    {
        "name": "search_legal_documents",
        "description": "Search Moroccan legal codes for relevant articles and provisions. Use this for any legal questions about Moroccan law.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The user's legal question or search query in Arabic or French"
                },
                "domain": {
                    "type": "string",
                    "enum": [
                        "penal", "civil", "family", "labor", "commercial",
                        "real_estate", "administrative", "procurement", "tax",
                        "consumer", "data_protection", "traffic", "all"
                    ],
                    "description": "The legal domain to search within. Use 'all' if uncertain."
                },
                "language": {
                    "type": "string",
                    "enum": ["ar", "fr"],
                    "description": "The language of the query and desired response"
                }
            },
            "required": ["query", "language"]
        }
    },
    {
        "name": "get_article_details",
        "description": "Retrieve specific details about a particular article from a Moroccan legal code",
        "parameters": {
            "type": "object",
            "properties": {
                "code_name": {
                    "type": "string",
                    "description": "Name of the legal code (e.g., 'Code Pénal', 'Moudawana')"
                },
                "article_number": {
                    "type": "string",
                    "description": "Article number to retrieve"
                },
                "language": {
                    "type": "string",
                    "enum": ["ar", "fr"],
                    "description": "Language for the response"
                }
            },
            "required": ["code_name", "article_number", "language"]
        }
    }
]


async def handle_function_call(function_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle function calls from OpenAI Realtime API.

    Args:
        function_name: Name of the function to execute
        arguments: Function arguments from OpenAI

    Returns:
        Function result to send back to OpenAI
    """
    try:
        logger.info(f"[Realtime] Function call: {function_name} with args: {arguments}")

        if function_name == "search_legal_documents":
            query = arguments.get("query", "")
            domain = arguments.get("domain", "all")
            language = arguments.get("language", "ar")

            # Call your existing RAG retrieval system
            results = await search_legal_documents(
                query=query,
                domain=domain if domain != "all" else None,
                language=language,
                top_k=5
            )

            if not results:
                return {
                    "success": False,
                    "message": "لم يتم العثور على نتائج" if language == "ar" else "Aucun résultat trouvé",
                    "articles": []
                }

            # Format results for AI
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "code": result.get("code_name", ""),
                    "article": result.get("article_number", ""),
                    "content": result.get("content", ""),
                    "relevance": result.get("score", 0.0)
                })

            return {
                "success": True,
                "count": len(formatted_results),
                "articles": formatted_results
            }

        elif function_name == "get_article_details":
            code_name = arguments.get("code_name", "")
            article_number = arguments.get("article_number", "")
            language = arguments.get("language", "ar")

            # Query specific article from database
            # This is a placeholder - implement your specific article retrieval
            result = await search_legal_documents(
                query=f"{code_name} article {article_number}",
                domain=None,
                language=language,
                top_k=1
            )

            if not result:
                return {
                    "success": False,
                    "message": f"لم يتم العثور على المادة {article_number}" if language == "ar"
                              else f"Article {article_number} non trouvé"
                }

            return {
                "success": True,
                "article": result[0] if result else None
            }

        else:
            return {
                "success": False,
                "error": f"Unknown function: {function_name}"
            }

    except Exception as e:
        logger.error(f"[Realtime] Function call error: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def relay_to_openai(
    client_ws: WebSocket,
    openai_ws: websockets.WebSocketClientProtocol,
    language: str
):
    """
    Relay messages from client to OpenAI Realtime API.

    Args:
        client_ws: WebSocket connection to client
        openai_ws: WebSocket connection to OpenAI
        language: User's preferred language (ar/fr)
    """
    try:
        while True:
            # Receive message from client
            try:
                message = await asyncio.wait_for(client_ws.receive_text(), timeout=30.0)
            except asyncio.TimeoutError:
                # Send keepalive ping
                await client_ws.send_json({"type": "ping"})
                continue
            except WebSocketDisconnect:
                logger.info("[Realtime] Client disconnected from relay")
                break

            logger.debug(f"[Realtime] Client → OpenAI: {message[:200]}")

            # Forward to OpenAI
            await openai_ws.send(message)

    except Exception as e:
        logger.error(f"[Realtime] Client→OpenAI relay error: {e}")
    finally:
        logger.info("[Realtime] Client→OpenAI relay stopped")


async def relay_from_openai(
    client_ws: WebSocket,
    openai_ws: websockets.WebSocketClientProtocol
):
    """
    Relay messages from OpenAI Realtime API to client, handling function calls.

    Args:
        client_ws: WebSocket connection to client
        openai_ws: WebSocket connection to OpenAI
    """
    try:
        while True:
            # Receive message from OpenAI
            message = await openai_ws.recv()

            # Parse OpenAI event
            try:
                event = json.loads(message)
                event_type = event.get("type", "")

                logger.debug(f"[Realtime] OpenAI → Client: {event_type}")

                # Handle function calls
                if event_type == "response.function_call_arguments.done":
                    call_id = event.get("call_id", "")
                    function_name = event.get("name", "")
                    arguments_json = event.get("arguments", "{}")

                    try:
                        arguments = json.loads(arguments_json)
                    except json.JSONDecodeError:
                        arguments = {}

                    # Execute function
                    result = await handle_function_call(function_name, arguments)

                    # Send result back to OpenAI
                    function_result = {
                        "type": "conversation.item.create",
                        "item": {
                            "type": "function_call_output",
                            "call_id": call_id,
                            "output": json.dumps(result)
                        }
                    }

                    await openai_ws.send(json.dumps(function_result))

                    # Trigger response generation
                    await openai_ws.send(json.dumps({
                        "type": "response.create"
                    }))

                    logger.info(f"[Realtime] Function call completed: {function_name}")

            except json.JSONDecodeError:
                logger.warning("[Realtime] Failed to parse OpenAI message as JSON")

            # Forward message to client
            await client_ws.send_text(message)

    except websockets.exceptions.ConnectionClosed:
        logger.info("[Realtime] OpenAI connection closed")
    except Exception as e:
        logger.error(f"[Realtime] OpenAI→Client relay error: {e}")
    finally:
        logger.info("[Realtime] OpenAI→Client relay stopped")


@router.websocket("/ws/realtime")
async def realtime_websocket_endpoint(
    websocket: WebSocket,
    language: str = "ar"
):
    """
    WebSocket endpoint for OpenAI Realtime API relay.

    Query Parameters:
        language: User's preferred language (ar/fr)

    Flow:
        1. Accept client WebSocket connection
        2. Establish connection to OpenAI Realtime API
        3. Send session configuration (model, voice, instructions)
        4. Relay bidirectional audio + events
        5. Handle function calls for RAG integration
    """
    await websocket.accept()
    logger.info(f"[Realtime] Client connected (language: {language})")

    # Select voice based on language
    voice = REALTIME_VOICE_AR if language == "ar" else REALTIME_VOICE_FR

    # System instructions (legal assistant persona)
    instructions = (
        "أنت محامي (Mo7ami)، مساعد قانوني مغربي يعتمد على القوانين الرسمية. "
        "استخدم دائمًا وظيفة search_legal_documents للإجابة على الأسئلة القانونية. "
        "اذكر المصادر من الجريدة الرسمية. إذا لم تكن متأكدًا، قل ذلك."
        if language == "ar" else
        "Vous êtes Mo7ami (محامي), un assistant juridique marocain basé sur les codes officiels. "
        "Utilisez toujours la fonction search_legal_documents pour les questions juridiques. "
        "Citez les sources du Bulletin Officiel. Si vous n'êtes pas sûr, dites-le."
    )

    try:
        # Connect to OpenAI Realtime API
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("[Realtime] OpenAI API key not configured")
            await websocket.close(code=1008, reason="API key not configured")
            return

        headers = {
            "Authorization": f"Bearer {api_key}",
            "OpenAI-Beta": "realtime=v1"
        }

        url = f"{REALTIME_API_URL}?model={REALTIME_MODEL}"

        logger.info(f"[Realtime] Connecting to OpenAI: {url}")

        async with websockets.connect(
            url,
            additional_headers=headers,
            ping_interval=20,
            ping_timeout=10
        ) as openai_ws:
            logger.info("[Realtime] Connected to OpenAI Realtime API")

            # Configure session
            session_config = {
                "type": "session.update",
                "session": {
                    "modalities": ["text", "audio"],
                    "instructions": instructions,
                    "voice": voice,
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "input_audio_transcription": {
                        "model": "whisper-1"
                    },
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.5,
                        "prefix_padding_ms": 300,
                        "silence_duration_ms": 500
                    },
                    "tools": LEGAL_FUNCTIONS,
                    "tool_choice": "auto",
                    "temperature": 0.8,
                    "max_response_output_tokens": 4096
                }
            }

            await openai_ws.send(json.dumps(session_config))
            logger.info(f"[Realtime] Session configured (voice: {voice}, language: {language})")

            # Start bidirectional relay
            await asyncio.gather(
                relay_to_openai(websocket, openai_ws, language),
                relay_from_openai(websocket, openai_ws)
            )

    except websockets.exceptions.InvalidStatusCode as e:
        logger.error(f"[Realtime] OpenAI connection failed: {e.status_code}")
        await websocket.close(code=1011, reason=f"OpenAI error: {e.status_code}")
    except Exception as e:
        logger.error(f"[Realtime] WebSocket error: {e}")
        await websocket.close(code=1011, reason="Internal error")
    finally:
        logger.info("[Realtime] Connection closed")


@router.get("/realtime/status")
async def realtime_status():
    """Check if Realtime API is properly configured."""
    return JSONResponse({
        "available": bool(os.getenv("OPENAI_API_KEY")),
        "model": REALTIME_MODEL,
        "voices": {
            "ar": REALTIME_VOICE_AR,
            "fr": REALTIME_VOICE_FR
        }
    })
