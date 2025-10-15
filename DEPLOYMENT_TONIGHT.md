# 🚀 Mo7ami.ai Deployment Action Plan
## Target: Launch Tonight at mo7ami.ai

### Phase 1: Critical Fixes (2 hours)

#### 1.1 Fix Database Connection
```bash
# Test current connection
supabase db remote set postgresql://[YOUR_NEW_CONNECTION_STRING]

# Or create new Supabase project
supabase init
supabase start
```

#### 1.2 Secure Environment Variables
```bash
# Create production env file
cp .env .env.production

# Update these values:
NEXT_PUBLIC_APP_URL=https://mo7ami.ai
NEXT_PUBLIC_API_URL=https://api.mo7ami.ai
NEXTAUTH_URL=https://mo7ami.ai
NEXTAUTH_SECRET=[GENERATE_NEW_SECRET]
```

#### 1.3 Backend Deployment Setup
```python
# backend/main.py - Add CORS for production
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mo7ami.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Phase 2: Deployment Infrastructure (1 hour)

#### 2.1 Vercel Deployment (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Configure domain
vercel domains add mo7ami.ai
```

#### 2.2 Railway/Render Deployment (Backend)
```yaml
# railway.json or render.yaml
services:
  - type: web
    name: mo7ami-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Phase 3: Final Checks (30 mins)

- [ ] Test Google OAuth flow
- [ ] Verify RAG responses with citations
- [ ] Test voice input/output
- [ ] Check mobile responsiveness
- [ ] Verify SSL certificates

### Phase 4: DNS Configuration (30 mins)

```dns
# Add to your DNS provider
A     @      76.76.21.21   (Vercel IP)
CNAME www    cname.vercel-dns.com
```

## 🎯 Quick Deployment Commands

```bash
# 1. Fix database first
supabase db push --db-url "postgresql://..."

# 2. Build and test locally
npm run build
npm start

# 3. Deploy frontend
vercel --prod

# 4. Deploy backend (using Railway)
railway login
railway init
railway up

# 5. Update environment variables on Vercel
vercel env pull
vercel env add PRODUCTION
```

## ⚡ Emergency Fallback Plan

If full deployment isn't ready:
1. Deploy frontend only on Vercel (static pages work)
2. Use local backend temporarily (tunnel with ngrok)
3. Launch "Beta Preview" with limited features
4. Full launch tomorrow with all features

## 📊 Post-Launch Checklist

- [ ] Monitor error logs (Vercel Analytics)
- [ ] Set up Uptime monitoring (UptimeRobot)
- [ ] Configure backup strategy
- [ ] Enable rate limiting
- [ ] Set up Google Analytics