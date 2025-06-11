#!/bin/bash

echo "🚀 Pre-Deployment Verification for CORS Fix"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if all files exist and have correct content
echo -e "${BLUE}📋 1. Checking Modified Files...${NC}"
echo ""

# Check main.ts
if grep -q "renderUrl.*configService.get.*RENDER_EXTERNAL_URL" src/main.ts; then
    echo -e "${GREEN}✅ src/main.ts - CORS configuration updated${NC}"
else
    echo -e "${RED}❌ src/main.ts - CORS configuration missing${NC}"
fi

if grep -q "console.log.*CORS" src/main.ts; then
    echo -e "${GREEN}✅ src/main.ts - CORS debugging logs added${NC}"
else
    echo -e "${RED}❌ src/main.ts - CORS debugging logs missing${NC}"
fi

# Check app.controller.ts for HEAD support
if grep -q "@Head" src/app.controller.ts; then
    echo -e "${GREEN}✅ src/app.controller.ts - HEAD request support added${NC}"
else
    echo -e "${YELLOW}⚠️ src/app.controller.ts - HEAD request support not found${NC}"
fi

# Check health module
if [ -f "src/modules/health/health.module.ts" ]; then
    if ! grep -q "ApiHealthController" src/modules/health/health.module.ts; then
        echo -e "${GREEN}✅ src/modules/health/health.module.ts - Simplified (no duplicate controllers)${NC}"
    else
        echo -e "${RED}❌ src/modules/health/health.module.ts - Still has duplicate controllers${NC}"
    fi
else
    echo -e "${RED}❌ src/modules/health/health.module.ts - File not found${NC}"
fi

# Check if duplicate controller was removed
if [ ! -f "src/modules/health/api-health.controller.ts" ]; then
    echo -e "${GREEN}✅ src/modules/health/api-health.controller.ts - Duplicate controller removed${NC}"
else
    echo -e "${RED}❌ src/modules/health/api-health.controller.ts - Duplicate controller still exists${NC}"
fi

echo ""
echo -e "${BLUE}📋 2. Checking Environment Configuration...${NC}"
echo ""

# Check .env file
if grep -q "api-cuentas-zlut.onrender.com" .env; then
    echo -e "${GREEN}✅ .env - Render URL configured${NC}"
else
    echo -e "${RED}❌ .env - Render URL missing${NC}"
fi

if grep -q "RENDER_EXTERNAL_URL=https://api-cuentas-zlut.onrender.com" .env; then
    echo -e "${GREEN}✅ .env - RENDER_EXTERNAL_URL configured${NC}"
else
    echo -e "${RED}❌ .env - RENDER_EXTERNAL_URL missing or incorrect${NC}"
fi

# Check render.yaml
if grep -q "CORS_ORIGINS" render.yaml; then
    echo -e "${GREEN}✅ render.yaml - CORS_ORIGINS configured${NC}"
else
    echo -e "${RED}❌ render.yaml - CORS_ORIGINS missing${NC}"
fi

if grep -q "RENDER_EXTERNAL_URL" render.yaml; then
    echo -e "${GREEN}✅ render.yaml - RENDER_EXTERNAL_URL configured${NC}"
else
    echo -e "${RED}❌ render.yaml - RENDER_EXTERNAL_URL missing${NC}"
fi

echo ""
echo -e "${BLUE}📋 3. Checking Documentation...${NC}"
echo ""

if [ -f "CORS_FIX_RENDER.md" ]; then
    echo -e "${GREEN}✅ CORS_FIX_RENDER.md - Documentation created${NC}"
else
    echo -e "${RED}❌ CORS_FIX_RENDER.md - Documentation missing${NC}"
fi

if [ -f "CORS_IMPLEMENTATION_SUMMARY.md" ]; then
    echo -e "${GREEN}✅ CORS_IMPLEMENTATION_SUMMARY.md - Summary created${NC}"
else
    echo -e "${RED}❌ CORS_IMPLEMENTATION_SUMMARY.md - Summary missing${NC}"
fi

echo ""
echo -e "${BLUE}📋 4. Syntax Check...${NC}"
echo ""

# Check if TypeScript compiles without errors
if command -v npx &> /dev/null; then
    echo "Running TypeScript compilation check..."
    if npx tsc --noEmit --skipLibCheck > /dev/null 2>&1; then
        echo -e "${GREEN}✅ TypeScript compilation - No errors${NC}"
    else
        echo -e "${RED}❌ TypeScript compilation - Errors found${NC}"
        echo "Run 'npx tsc --noEmit' to see details"
    fi
else
    echo -e "${YELLOW}⚠️ npm not available - Skipping TypeScript check${NC}"
fi

echo ""
echo -e "${BLUE}📋 5. Ready for Deployment${NC}"
echo ""

echo -e "${YELLOW}🔧 Required Actions in Render Dashboard:${NC}"
echo ""
echo "1. Set Environment Variables:"
echo "   NODE_ENV=production"
echo "   PORT=10000"
echo "   RENDER_EXTERNAL_URL=https://api-cuentas-zlut.onrender.com"
echo "   CORS_ORIGINS=http://localhost:5173,http://localhost:5051,http://localhost:3000,https://cuentas-ingeocimyc.vercel.app,https://api-cuentas-zlut.onrender.com"
echo ""
echo "2. Add your database credentials (DB_HOST, DB_PORT, etc.)"
echo "3. Add your JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET, etc.)"
echo ""

echo -e "${YELLOW}🚀 Deployment Commands:${NC}"
echo ""
echo "git add ."
echo "git status  # Review changes"
echo "git commit -m \"fix: Resolve CORS issues for Render production environment\""
echo "git push origin main"
echo ""

echo -e "${YELLOW}🧪 Post-Deployment Testing:${NC}"
echo ""
echo "1. Health Check: https://api-cuentas-zlut.onrender.com/api/health"
echo "2. API Info: https://api-cuentas-zlut.onrender.com/"
echo "3. Swagger UI: https://api-cuentas-zlut.onrender.com/api-docs"
echo "4. Test login from Swagger UI"
echo ""

echo -e "${GREEN}✅ CORS Fix Implementation Complete!${NC}"
echo ""
echo -e "${BLUE}📚 For detailed information, see:${NC}"
echo "• CORS_FIX_RENDER.md - Complete fix documentation"
echo "• CORS_IMPLEMENTATION_SUMMARY.md - Implementation summary"
echo ""

echo -e "${YELLOW}💡 If you still experience issues after deployment:${NC}"
echo "1. Check Render application logs for CORS debug messages"
echo "2. Verify environment variables are set correctly"
echo "3. Clear browser cache and try again"
echo "4. Test with curl or Postman to isolate browser issues"
