#!/bin/bash

# Secure API Keys Management Script for mo7ami.ai
# This script helps rotate and secure API keys for production deployment

set -e

echo "🔐 Mo7ami.ai API Key Security Script"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file first"
    exit 1
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating from template...${NC}"
    cp .env .env.production
fi

# Function to mask API key
mask_key() {
    local key=$1
    if [ -z "$key" ]; then
        echo "NOT_SET"
    else
        local length=${#key}
        if [ $length -gt 8 ]; then
            echo "${key:0:4}...${key: -4}"
        else
            echo "***"
        fi
    fi
}

# Read current keys
CURRENT_OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d '=' -f2)
CURRENT_GOOGLE_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" .env | cut -d '=' -f2)
CURRENT_SUPABASE_SERVICE=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d '=' -f2)

echo "Current API Keys Status:"
echo "------------------------"
echo "OpenAI API Key: $(mask_key "$CURRENT_OPENAI_KEY")"
echo "Google Client Secret: $(mask_key "$CURRENT_GOOGLE_SECRET")"
echo "Supabase Service Key: $(mask_key "$CURRENT_SUPABASE_SERVICE")"
echo ""

# Check for exposed keys in code
echo "🔍 Scanning for exposed API keys in codebase..."
echo ""

# Files to exclude from scanning
EXCLUDE_PATTERN="node_modules|.git|.next|dist|build"

# Search for potential exposed keys
EXPOSED_COUNT=0

# Check for OpenAI keys
if grep -r "sk-proj-" . --exclude-dir={node_modules,.git,.next,dist,build} --exclude="*.env*" 2>/dev/null | grep -v "secure-api-keys.sh"; then
    echo -e "${RED}⚠️  WARNING: OpenAI API key found in code!${NC}"
    EXPOSED_COUNT=$((EXPOSED_COUNT + 1))
fi

# Check for Google secrets
if grep -r "GOCSPX-" . --exclude-dir={node_modules,.git,.next,dist,build} --exclude="*.env*" 2>/dev/null | grep -v "secure-api-keys.sh"; then
    echo -e "${RED}⚠️  WARNING: Google Client Secret found in code!${NC}"
    EXPOSED_COUNT=$((EXPOSED_COUNT + 1))
fi

# Check for Supabase keys
if grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . --exclude-dir={node_modules,.git,.next,dist,build} --exclude="*.env*" --exclude="*.md" 2>/dev/null | grep -v "secure-api-keys.sh" | grep -v "NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
    echo -e "${RED}⚠️  WARNING: Supabase service key may be exposed!${NC}"
    EXPOSED_COUNT=$((EXPOSED_COUNT + 1))
fi

if [ $EXPOSED_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ No exposed API keys found in code${NC}"
else
    echo -e "${RED}❌ Found $EXPOSED_COUNT potential API key exposures${NC}"
    echo ""
    echo "Recommended Actions:"
    echo "1. Remove all hardcoded API keys from source code"
    echo "2. Use environment variables exclusively"
    echo "3. Rotate compromised keys immediately"
fi

echo ""
echo "📋 Production Environment Setup:"
echo "================================"
echo ""

# Create secure .env.production.local for actual keys
cat > .env.production.local.template << 'EOF'
# ===== PRODUCTION SECRETS =====
# This file should NEVER be committed to git
# Add to .gitignore immediately

# Replace these with your actual production keys
OPENAI_API_KEY=your_production_openai_key_here
GOOGLE_CLIENT_SECRET=your_production_google_secret_here
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_key_here

# Database (use production connection string)
DATABASE_URL=your_production_database_url_here
DIRECT_URL=your_production_direct_database_url_here

# Additional production secrets
NEXTAUTH_SECRET=generate_new_secret_with_openssl_rand_base64_32
SENTRY_DSN=your_sentry_dsn_if_using
GA_MEASUREMENT_ID=your_google_analytics_id
EOF

echo -e "${GREEN}✅ Created .env.production.local.template${NC}"
echo ""

# Update .gitignore to ensure secrets are not committed
if ! grep -q ".env.production.local" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Production secrets - NEVER commit" >> .gitignore
    echo ".env.production.local" >> .gitignore
    echo ".env.local" >> .gitignore
    echo "*.key" >> .gitignore
    echo "*.pem" >> .gitignore
    echo -e "${GREEN}✅ Updated .gitignore for security${NC}"
fi

echo ""
echo "🚀 Deployment Security Checklist:"
echo "=================================="
echo ""
echo "[ ] 1. Rotate OpenAI API key at https://platform.openai.com/api-keys"
echo "[ ] 2. Create new Google OAuth credentials for production domain"
echo "[ ] 3. Generate new Supabase project for production"
echo "[ ] 4. Set up environment variables in Vercel/Railway dashboard"
echo "[ ] 5. Enable API key usage limits and monitoring"
echo "[ ] 6. Set up billing alerts for all services"
echo "[ ] 7. Configure CORS to only allow mo7ami.ai domain"
echo "[ ] 8. Enable rate limiting on API endpoints"
echo "[ ] 9. Set up error tracking (Sentry recommended)"
echo "[ ] 10. Configure SSL certificates for mo7ami.ai"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Never commit .env files with real API keys to git${NC}"
echo -e "${YELLOW}⚠️  Use environment variables in your deployment platform instead${NC}"
echo ""
echo "✨ Script complete! Follow the checklist above for secure deployment."