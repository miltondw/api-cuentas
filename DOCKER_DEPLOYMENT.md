# DESPLIEGUE EN RENDER CON DOCKER Y PUPPETEER

## 🐳 Cambios Realizados para Docker

### 1. Package.json Actualizado

- ✅ Movido `tsconfig-paths` a `dependencies` para producción
- ✅ Actualizado `start:prod` a `node dist/main.js`
- ✅ Eliminado duplicado de `tsconfig-paths` en devDependencies

### 2. Dockerfile Creado

- ✅ Etapa multi-stage para optimizar tamaño
- ✅ Imagen base con Puppeteer preconfigurado (`ghcr.io/puppeteer/puppeteer`)
- ✅ Variables de entorno para Chromium
- ✅ Comando de inicio directo: `node dist/main.js`

### 3. Render.yaml Actualizado

- ✅ Cambiado `env: node` a `env: docker`
- ✅ Eliminado `PORT=5051` (Render asigna puerto dinámicamente)
- ✅ Removido `buildCommand` y `startCommand` (Docker se encarga)
- ✅ Mantenido `healthCheckPath: /api/health`

### 4. Archivos de Soporte

- ✅ `.dockerignore` creado para optimizar build
- ✅ `main.ts` actualizado con `tsconfig-paths/register`

## 🚀 Instrucciones de Despliegue

### Paso 1: Variables de Entorno en Render

Configura estas variables en el dashboard de Render:

```
NODE_ENV = production
DATABASE_URL = tu_conexion_a_base_de_datos
JWT_SECRET = tu_jwt_secret_aqui
```

### Paso 2: Commit y Push

```bash
git add .
git commit -m "feat: Add Docker support for Puppeteer deployment on Render"
git push origin main
```

### Paso 3: Verificar Deploy

1. Render detectará automáticamente el Dockerfile
2. Iniciará build usando Docker
3. La aplicación estará disponible en: `https://api-cuentas-zlut.onrender.com`

## 🐛 Troubleshooting

### Si falla el build Docker:

1. Verifica que `Dockerfile` esté en la raíz del proyecto
2. Revisa los logs de build en Render dashboard
3. Asegúrate de que las variables de entorno estén configuradas

### Si Puppeteer falla:

- El Dockerfile ya incluye todas las dependencias de Chromium
- Variables `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` y `PUPPETEER_EXECUTABLE_PATH` están configuradas

### Si los path aliases fallan:

- `tsconfig-paths` está en dependencies
- `main.ts` importa `tsconfig-paths/register`
- `tsconfig.json` tiene paths configurados correctamente

## 📊 Recursos en Render

- **Plan**: Free (puede necesitar upgrade si Puppeteer consume mucha memoria)
- **Ambiente**: Docker
- **Puerto**: Asignado dinámicamente por Render
- **Health Check**: `/api/health`

## ✅ Ventajas de esta Configuración

1. **Puppeteer funcional**: Chromium preinstalado
2. **Optimizado**: Build multi-stage reduce tamaño final
3. **Escalable**: Fácil migración a planes pagos
4. **Mantenible**: Configuración estándar de Docker
