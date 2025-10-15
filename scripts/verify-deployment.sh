#!/bin/bash

# Mo7ami.ai Deployment Verification Script
# Run this before deploying to ensure everything is ready

set -e

echo "🚀 Mo7ami.ai Deployment Verification"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

READY=true
WARNINGS=0
ERRORS=0

# Function to check requirement
check_requirement() {
    local name=$1
    local check_command=$2
    local status=$3

    if eval $check_command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name${NC}"
        return 0
    else
        if [ "$status" = "critical" ]; then
            echo -e "${RED}❌ $name - CRITICAL${NC}"
            ERRORS=$((ERRORS + 1))
            READY=false
        else
            echo -e "${YELLOW}⚠️  $name - WARNING${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 1
    fi
}

echo "1. Environment Configuration"
echo "----------------------------"
check_requirement ".env file exists" "[ -f .env ]" "critical"
check_requirement ".env.production exists" "[ -f .env.production ]" "critical"
check_requirement "NextAuth secret configured" "grep -q 'NEXTAUTH_SECRET=' .env.production" "critical"
check_requirement "OpenAI API key set" "grep -q 'OPENAI_API_KEY=' .env" "critical"
check_requirement "Supabase URL configured" "grep -q 'NEXT_PUBLIC_SUPABASE_URL=' .env" "critical"
echo ""

echo "2. Build & Dependencies"
echo "-----------------------"
check_requirement "Node modules installed" "[ -d node_modules ]" "critical"
check_requirement "TypeScript config exists" "[ -f tsconfig.json ]" "critical"
check_requirement "Next.js config exists" "[ -f next.config.mjs ]" "critical"
echo ""

echo "3. Database & Backend"
echo "---------------------"
check_requirement "Prisma schema exists" "[ -f prisma/schema.prisma ]" "warning"
check_requirement "Backend main.py exists" "[ -f backend/main.py ]" "warning"
check_requirement "Backend requirements.txt exists" "[ -f backend/requirements.txt ]" "warning"
echo ""

echo "4. Voice Features"
echo "-----------------"
check_requirement "Voice recorder component" "[ -f components/voice/VoiceRecorderEnhanced.tsx ]" "critical"
check_requirement "Voice CSS animations" "grep -q 'voice-pulse' app/globals.css" "warning"
echo ""

echo "5. Security Checks"
echo "------------------"
# Check for exposed API keys (excluding documentation and scripts)
if grep -r "sk-proj-" . --exclude-dir={node_modules,.git,.next,scripts} --exclude="*.env*" --exclude="*.md" 2>/dev/null | grep -v "your-actual-key-here" | grep -v "secure-api-keys.sh" > /dev/null 2>&1; then
    echo -e "${RED}❌ OpenAI key exposed in code${NC}"
    ERRORS=$((ERRORS + 1))
    READY=false
else
    echo -e "${GREEN}✅ No OpenAI keys in code${NC}"
fi

if grep -q ".env.production.local" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ Production secrets in .gitignore${NC}"
else
    echo -e "${YELLOW}⚠️  Add .env.production.local to .gitignore${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "6. Production Build Test"
echo "------------------------"
echo "Running production build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Production build successful${NC}"
else
    echo -e "${RED}❌ Production build failed${NC}"
    ERRORS=$((ERRORS + 1))
    READY=false
fi
echo ""

echo "7. Domain & Deployment"
echo "----------------------"
echo -e "${BLUE}ℹ️  Domain: mo7ami.ai${NC}"
echo -e "${BLUE}ℹ️  Frontend: Deploy to Vercel${NC}"
echo -e "${BLUE}ℹ️  Backend: Deploy to Railway/Render${NC}"
echo -e "${BLUE}ℹ️  Database: Supabase (PostgreSQL + pgvector)${NC}"
echo ""

echo "===================================="
echo "         DEPLOYMENT SUMMARY         "
echo "===================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 PERFECT! Ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: vercel --prod"
    echo "2. Configure domain at: https://vercel.com/dashboard"
    echo "3. Deploy backend to Railway/Render"
    echo "4. Update DNS records for mo7ami.ai"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  READY with $WARNINGS warnings${NC}"
    echo ""
    echo "You can deploy, but consider fixing warnings first."
else
    echo -e "${RED}❌ NOT READY - $ERRORS critical errors found${NC}"
    echo ""
    echo "Fix critical errors before deploying."
fi

echo ""
echo "📊 Deployment Readiness Score:"
if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}████████████████████ 100%${NC}"
    elif [ $WARNINGS -le 2 ]; then
        echo -e "${GREEN}████████████████${NC}░░░░ 85%"
    else
        echo -e "${YELLOW}████████████${NC}░░░░░░░░ 75%"
    fi
else
    echo -e "${RED}████████${NC}░░░░░░░░░░░░ 40%"
fi

echo ""
echo "✨ Run './scripts/secure-api-keys.sh' for API key security"
echo "📚 Check DEPLOYMENT_TONIGHT.md for step-by-step guide"
echo "💰 Review MONETIZATION_STRATEGY.md for revenue plan"