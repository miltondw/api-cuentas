#!/bin/bash

echo "🔍 CORS Configuration Checklist for Render"
echo "=========================================="
echo ""

# Check local configuration files
echo "📋 1. Checking local configuration files..."
echo ""

if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    if grep -q "CORS_ORIGINS.*api-cuentas-zlut.onrender.com" .env; then
        echo "✅ CORS_ORIGINS includes Render URL in .env"
    else
        echo "❌ CORS_ORIGINS missing Render URL in .env"
    fi
    
    if grep -q "RENDER_EXTERNAL_URL.*api-cuentas-zlut.onrender.com" .env; then
        echo "✅ RENDER_EXTERNAL_URL configured in .env"
    else
        echo "❌ RENDER_EXTERNAL_URL missing in .env"
    fi
else
    echo "❌ .env file not found"
fi

echo ""

if [ -f "render.yaml" ]; then
    echo "✅ render.yaml file exists"
    
    if grep -q "CORS_ORIGINS" render.yaml; then
        echo "✅ CORS_ORIGINS configured in render.yaml"
    else
        echo "❌ CORS_ORIGINS missing in render.yaml"
    fi
    
    if grep -q "RENDER_EXTERNAL_URL" render.yaml; then
        echo "✅ RENDER_EXTERNAL_URL configured in render.yaml"
    else
        echo "❌ RENDER_EXTERNAL_URL missing in render.yaml"
    fi
else
    echo "❌ render.yaml file not found"
fi

echo ""
echo "📋 2. Checking CORS configuration in main.ts..."

if [ -f "src/main.ts" ]; then
    echo "✅ src/main.ts exists"
    
    if grep -q "renderUrl" src/main.ts; then
        echo "✅ Render URL handling added to CORS config"
    else
        echo "❌ Render URL handling missing in CORS config"
    fi
    
    if grep -q "sameOrigin" src/main.ts; then
        echo "✅ Same-origin handling added to CORS config"
    else
        echo "❌ Same-origin handling missing in CORS config"
    fi
    
    if grep -q "console.log.*CORS" src/main.ts; then
        echo "✅ CORS debugging logs added"
    else
        echo "❌ CORS debugging logs missing"
    fi
else
    echo "❌ src/main.ts not found"
fi

echo ""
echo "📋 3. Required Environment Variables for Render Dashboard:"
echo ""
echo "🔧 Set these in your Render service dashboard:"
echo ""
echo "NODE_ENV=production"
echo "PORT=10000"
echo "RENDER_EXTERNAL_URL=https://api-cuentas-zlut.onrender.com"
echo "CORS_ORIGINS=http://localhost:5173,http://localhost:5051,http://localhost:3000,https://cuentas-ingeocimyc.vercel.app,https://api-cuentas-zlut.onrender.com"
echo ""
echo "Plus your database and security variables..."
echo ""

echo "📋 4. Deployment Steps:"
echo ""
echo "1. ✅ Code changes completed (if checklist above passes)"
echo "2. 🔄 Commit and push changes:"
echo "   git add ."
echo "   git commit -m 'fix: Configure CORS for Render production'"
echo "   git push origin main"
echo ""
echo "3. 🌐 Configure environment variables in Render dashboard"
echo "4. 🚀 Redeploy service in Render"
echo "5. 🧪 Test Swagger UI at: https://api-cuentas-zlut.onrender.com/api-docs"
echo ""

echo "📋 5. Testing after deployment:"
echo ""
echo "Test these URLs:"
echo "• Health: https://api-cuentas-zlut.onrender.com/api/health"
echo "• Swagger: https://api-cuentas-zlut.onrender.com/api-docs"
echo "• API Info: https://api-cuentas-zlut.onrender.com/"
echo ""

echo "🎯 Success indicators:"
echo "• No CORS errors in browser console"
echo "• Swagger UI loads completely"
echo "• Login endpoint works from Swagger"
echo "• API responses include proper CORS headers"
