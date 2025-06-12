#!/bin/bash

# 🔍 Pre-deployment verification script
# =====================================

echo "🔍 Pre-deployment Verification for Render"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0

# Function to check if a file exists
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description${NC}"
    else
        echo -e "${RED}❌ $description${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check if a pattern exists in a file
check_pattern() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅ $description${NC}"
    else
        echo -e "${RED}❌ $description${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

echo -e "\n${BLUE}📁 Checking Required Files${NC}"
echo "=========================="

check_file "src/app.controller.ts" "Root controller exists"
check_file "src/modules/health/health.controller.ts" "Health controller exists"
check_file "src/modules/health/api-health.controller.ts" "API Health controller exists"
check_file "src/modules/health/health.module.ts" "Health module exists"
check_file "scripts/render-build.sh" "Render build script exists"
check_file "start.js" "Start script exists"

echo -e "\n${BLUE}🔧 Checking Configuration${NC}"
echo "========================="

check_pattern "src/app.module.ts" "AppController" "AppController imported in AppModule"
check_pattern "src/app.module.ts" "HealthModule" "HealthModule imported in AppModule"
check_pattern "src/app.module.ts" "controllers.*AppController" "AppController added to controllers array"

echo -e "\n${BLUE}📋 Checking Endpoints Implementation${NC}"
echo "===================================="

check_pattern "src/app.controller.ts" "@Get()" "Root endpoint implemented"
check_pattern "src/modules/health/health.controller.ts" "@Get()" "Health endpoint implemented"
check_pattern "src/modules/health/api-health.controller.ts" "@Get()" "API Health endpoint implemented"

echo -e "\n${BLUE}🚀 Checking Build Requirements${NC}"
echo "=============================="

check_file "package.json" "Package.json exists"
check_file "nest-cli.json" "NestJS CLI config exists"
check_file "tsconfig.json" "TypeScript config exists"

echo -e "\n${BLUE}📊 Summary${NC}"
echo "=========="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Commit all changes: git add . && git commit -m 'Add health check endpoints'"
    echo "2. Push to GitHub: git push origin main"
    echo "3. Render will auto-deploy the changes"
    echo "4. Update Health Check Path in Render dashboard to: /health"
    echo ""
    echo -e "${GREEN}🎉 The 404 errors should be resolved after deployment!${NC}"
else
    echo -e "${RED}❌ $ERRORS error(s) found. Please fix before deployment.${NC}"
    exit 1
fi
