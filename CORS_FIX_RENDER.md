# 🔧 CORS Configuration Fix for Render Deployment

## ❌ Problem
When trying to use Swagger UI at `https://api-cuentas-zlut.onrender.com/api-docs/#/Authentication/AuthController_login`, you get:
```
Error 500: Error: Not allowed by CORS
```

## ✅ Solution

The issue is that CORS is not configured to allow requests from the same origin (Swagger UI making requests to the API on the same domain).

### 1. Configure Environment Variables in Render Dashboard

Go to your Render dashboard for the `api-cuentas-nestjs` service and add/update these environment variables:

**Required Variables:**
```bash
NODE_ENV=production
PORT=10000
RENDER_EXTERNAL_URL=https://api-cuentas-zlut.onrender.com
CORS_ORIGINS=http://localhost:5173,http://localhost:5051,http://localhost:3000,https://cuentas-ingeocimyc.vercel.app,https://api-cuentas-zlut.onrender.com
```

**Database Variables (add your actual values):**
```bash
DB_HOST=your-db-host
DB_PORT=3306
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_DATABASE=your-db-name
```

**Security Variables (add your actual values):**
```bash
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
JWT_SECRET_2=your-jwt-secret-2
CSRF_SECRET=your-csrf-secret
```

### 2. Verify render.yaml Configuration

The `render.yaml` file should include:
```yaml
services:
  - type: web
    name: api-cuentas-nestjs
    env: docker
    plan: free
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: RENDER_EXTERNAL_URL
        value: https://api-cuentas-zlut.onrender.com
      - key: CORS_ORIGINS
        value: "http://localhost:5173,http://localhost:5051,http://localhost:3000,https://cuentas-ingeocimyc.vercel.app,https://api-cuentas-zlut.onrender.com"
```

### 3. Code Changes Made

The CORS configuration in `src/main.ts` has been updated to:

1. **Allow the Render URL** in allowed origins
2. **Include same-origin requests** for Swagger UI
3. **Add debugging logs** to track CORS decisions
4. **Handle production environment** correctly

Key changes:
- Added `RENDER_EXTERNAL_URL` to allowed origins
- Added same-origin detection for Swagger UI
- Added fallback for Render domain matching
- Added console logs for CORS debugging

### 4. How to Deploy the Fix

1. **Commit and push** the code changes:
   ```bash
   git add .
   git commit -m "fix: Configure CORS for Render production environment"
   git push origin main
   ```

2. **Configure environment variables** in Render dashboard (see step 1)

3. **Redeploy** the service in Render dashboard

4. **Test** the Swagger UI at `https://api-cuentas-zlut.onrender.com/api-docs`

### 5. Testing the Fix

After deployment, test these endpoints:

1. **Health Check**: `https://api-cuentas-zlut.onrender.com/api/health`
2. **Swagger UI**: `https://api-cuentas-zlut.onrender.com/api-docs`
3. **Login from Swagger**: Try the login endpoint directly from Swagger UI

### 6. Debug Information

If you still see CORS errors, check the application logs in Render for messages like:
```
🌐 CORS: Checking origin: https://api-cuentas-zlut.onrender.com
🌐 CORS: Allowed origins: ...
✅ CORS: Origin https://api-cuentas-zlut.onrender.com is allowed
```

### 7. Alternative Testing Method

If Swagger UI still doesn't work, you can test the API endpoints using:

1. **Postman** or **Insomnia**
2. **curl** commands
3. **Frontend application** from the allowed origins

Example curl test:
```bash
curl -X POST https://api-cuentas-zlut.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://api-cuentas-zlut.onrender.com" \
  -d '{"email":"your-email","password":"your-password"}'
```

## 🎯 Expected Result

After applying this fix:
- ✅ Swagger UI should work correctly
- ✅ Login endpoint should accept requests from Swagger
- ✅ All API endpoints should be accessible
- ✅ CORS errors should be resolved

## 📝 Notes

- The `.env` file is only for local development
- Production environment variables must be set in Render dashboard
- Always use HTTPS URLs for production origins
- The `render.yaml` file helps ensure consistent deployment
