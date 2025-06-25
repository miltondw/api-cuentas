# ==================================================
# 🐳 DOCKERFILE OPTIMIZADO - API CUENTAS NESTJS
# ==================================================

# ---- Etapa de Build ----
FROM node:18-alpine AS builder

# Instalar herramientas del sistema necesarias
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

# Copiar solo package.json primero para aprovechar cache de Docker
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies para build)
RUN npm ci --only=production=false && npm cache clean --force

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Remover devDependencies después del build
RUN npm prune --production

# ---- Etapa de Producción ----
FROM node:18-alpine AS production

# Variables de seguridad y optimización
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_CACHE=/tmp/.npm

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /usr/src/app

# Cambiar propietario del directorio
RUN chown -R nestjs:nodejs /usr/src/app

# Cambiar a usuario no-root
USER nestjs

# Copiar solo archivos necesarios desde builder
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist

# Crear directorio para uploads con permisos correctos
RUN mkdir -p uploads/pdfs

# Exponer puerto
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:10000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
CMD ["node", "dist/main.js"]