# CONFIGURACIÓN RENDER DASHBOARD - INSTRUCCIONES

## 🚨 CONFIGURACIONES CRÍTICAS A CAMBIAR

### En Render Dashboard > Settings > Build & Deploy:

#### 1. Build Command (CORREGIDO para "nest: not found")
```bash
chmod +x scripts/render-build.sh && scripts/render-build.sh
```

**Alternativa si el script no funciona:**
```bash
npm ci && npx nest build && echo "Build verification:" && ls -la dist/ && echo "Checking main.js:" && ls -la dist/main.js
```

**Alternativa con fallback:**
```bash
npm ci && (npx nest build || npx tsc -p tsconfig.build.json) && ls -la dist/
```

#### 2. Start Command
```bash
node dist/main.js
```

#### 3. Pre-Deploy Command (Opcional)
```bash
echo "Starting deployment..." && node --version && npm --version
```

## 📋 PASOS DETALLADOS:

### Opción A: Actualizar Dashboard Manual

1. **Ir a Render Dashboard**
   - https://dashboard.render.com
   - Selecciona tu servicio `api-cuentas-nestjs`

2. **Navegar a Settings**
   - Clic en "Settings" en el menú lateral

3. **Sección "Build & Deploy"**
   - **Build Command:** Cambiar de `npm install` a la configuración arriba
   - **Start Command:** Cambiar de `node src/index.js` a `node dist/main.js`

4. **Environment Variables** (verificar que existan):
   - `NODE_ENV` = `production`
   - `PORT` = `5051`

5. **Health Check Path:**
   - `/api/health`

6. **Guardar cambios**
   - Clic en "Save Changes"

7. **Trigger Deploy**
   - Clic en "Manual Deploy" > "Deploy latest commit"

### Opción B: Usar render.yaml (Automático)

1. **Confirmar que render.yaml está en root** ✅
2. **Commit y push cambios:**
   ```bash
   git add .
   git commit -m "fix: Add render.yaml with correct build/start commands"
   git push origin main
   ```
3. **Render debería detectar automáticamente el archivo**

## ⚠️ PROBLEMAS COMUNES:

### Si render.yaml no es detectado:
1. Asegúrate de que esté en la raíz del repo
2. Verifica la sintaxis YAML
3. Borra el servicio y recréalo (último recurso)

### Si el build falla:
1. Revisa que todas las dependencias estén en package.json
2. Confirma que TypeScript esté en devDependencies
3. Verifica que nest-cli.json exista

## 🔍 VERIFICACIÓN POST-DEPLOY:

1. **Logs de Build:**
   - Busca: "Build verification:"
   - Debe mostrar archivos en dist/
   - Debe confirmar que main.js existe

2. **Logs de Start:**
   - Busca: "🚀 Application is running on:"
   - Debe mostrar puerto 5051

3. **Health Check:**
   - https://tu-app.render.com/api/health
   - Debe responder 200 OK

4. **API Docs:**
   - https://tu-app.render.com/api-docs
   - Debe cargar Swagger UI

## 📝 CONFIGURACIÓN FINAL ESPERADA:

```
Build Command: npm ci && npm run build && echo "Build verification:" && ls -la dist/ && echo "Checking main.js:" && ls -la dist/main.js
Start Command: node dist/main.js
Environment Variables:
  - NODE_ENV=production
  - PORT=5051
Health Check Path: /api/health
Auto-Deploy: ✅ Enabled
```

---

**⚡ ACCIÓN INMEDIATA REQUERIDA:**
Cambia el Start Command de `node src/index.js` a `node dist/main.js` en el dashboard de Render AHORA.
