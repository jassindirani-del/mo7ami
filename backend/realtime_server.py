"""
Minimal FastAPI server for OpenAI Realtime API WebSocket relay
"""

import os
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import websockets
from loguru import logger

app = FastAPI(title="Mo7ami Realtime Voice Server")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
REALTIME_MODEL = "gpt-4o-realtime-preview-2024-10-01"
REALTIME_VOICE_AR = "shimmer"
REALTIME_VOICE_FR = "nova"


@app.get("/")
async def root():
    return {"message": "Mo7ami Realtime Voice Server", "status": "running"}


@app.get("/health")
async def health():
    return {
        "message": "Mo7ami Backend with OpenAI",
        "version": "0.1.0",
        "status": "running",
        "ai_enabled": bool(OPENAI_API_KEY)
    }


@app.get("/api/v1/realtime/status")
async def realtime_status():
    return {
        "available": bool(OPENAI_API_KEY),
        "model": REALTIME_MODEL,
        "voices": {
            "ar": REALTIME_VOICE_AR,
            "fr": REALTIME_VOICE_FR
        }
    }


@app.websocket("/api/v1/realtime/ws/realtime")
async def realtime_websocket(websocket: WebSocket, language: str = "ar"):
    """
    WebSocket relay to OpenAI Realtime API
    """
    await websocket.accept()
    logger.info(f"[Realtime] Client connected (language: {language})")

    if not OPENAI_API_KEY:
        await websocket.close(code=1008, reason="OpenAI API key not configured")
        return

    voice = REALTIME_VOICE_AR if language == "ar" else REALTIME_VOICE_FR
    instructions = (
        "أنت محامي (Mo7ami)، مساعد قانوني مغربي. تحدث بوضوح واذكر المصادر القانونية."
        if language == "ar" else
        "Vous êtes Mo7ami, assistant juridique marocain. Parlez clairement et citez les sources légales."
    )

    # Connect to OpenAI
    url = f"wss://api.openai.com/v1/realtime?model={REALTIME_MODEL}"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "OpenAI-Beta": "realtime=v1"
    }

    try:
        async with websockets.connect(url, additional_headers=headers) as openai_ws:
            logger.info("[Realtime] Connected to OpenAI")

            # Configure session
            session_config = {
                "type": "session.update",
                "session": {
                    "modalities": ["text", "audio"],
                    "instructions": instructions,
                    "voice": voice,
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "temperature": 0.8,
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.5,
                        "silence_duration_ms": 500
                    }
                }
            }
            await openai_ws.send(json.dumps(session_config))

            # Bidirectional relay
            async def relay_client_to_openai():
                try:
                    while True:
                        message = await websocket.receive_text()
                        await openai_ws.send(message)
                except WebSocketDisconnect:
                    logger.info("[Realtime] Client disconnected")

            async def relay_openai_to_client():
                try:
                    while True:
                        message = await openai_ws.recv()
                        await websocket.send_text(message)
                except websockets.exceptions.ConnectionClosed:
                    logger.info("[Realtime] OpenAI disconnected")

            # Run both relays concurrently
            await asyncio.gather(
                relay_client_to_openai(),
                relay_openai_to_client(),
                return_exceptions=True
            )

    except Exception as e:
        logger.error(f"[Realtime] Error: {e}")
        await websocket.close(code=1011, reason=str(e))
    finally:
        logger.info("[Realtime] Connection closed")


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🚀 Mo7ami Realtime Voice Server")
    print("=" * 60)
    print(f"✅ OpenAI Key: {'Configured' if OPENAI_API_KEY else '❌ Missing'}")
    print(f"✅ Model: {REALTIME_MODEL}")
    print(f"✅ Voices: AR={REALTIME_VOICE_AR}, FR={REALTIME_VOICE_FR}")
    print("=" * 60)
    print("Starting server on http://0.0.0.0:4001")
    print("WebSocket: ws://localhost:4001/api/v1/realtime/ws/realtime")
    print("=" * 60)

    uvicorn.run(app, host="0.0.0.0", port=4001, log_level="info")
