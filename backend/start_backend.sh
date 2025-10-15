#!/bin/bash

# Load environment variables from parent .env file
export $(cat ../.env | grep -v '^#' | xargs)

# Set required variables
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-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}"
export VOICE_STT_PROVIDER="openai"

# Start backend
cd /Users/yassinedrani/Desktop/mo7ami/backend
python3.12 -m uvicorn main:app --host 0.0.0.0 --port 4001 --reload
