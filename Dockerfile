# ==================================================
# 🐳 DOCKERFILE OPTIMIZADO - API CUENTAS NESTJS
# ==================================================

# ---- Etapa de Build ----
FROM node:22-alpine3.20 AS builder

# Instalar solo las herramientas necesarias para dependencias nativas
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Configurar entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /usr/src/app

# Copiar package.json y package-lock.json para cache
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci && npm cache clean --force

# Copiar código fuente y scripts
COPY . .

# Dar permisos al script build.sh
RUN chmod +x file_build/build.sh

# Ejecutar build.sh en lugar de npm run build
RUN ./file_build/build.sh

# Remover devDependencies
RUN npm prune --production && npm cache clean --force

# Limpiar herramientas temporales
RUN apk del .build-deps

# ---- Etapa de Producción ----
FROM node:22-alpine3.20 AS production

# Instalar dependencias mínimas para Puppeteer en producción
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Configurar entorno para Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /usr/src/app

# Cambiar propietario del directorio
RUN chown -R nestjs:nodejs /usr/src/app

# Cambiar a usuario no-root
USER nestjs

# Copiar solo lo necesario desde builder
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/uploads ./uploads

# Crear directorio para uploads con permisos
RUN mkdir -p uploads/pdfs && chmod -R 775 uploads/pdfs

# Exponer puerto correcto
EXPOSE 5051

# Healthcheck alineado con main.ts
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5051/health || exit 1

# Comando de inicio
CMD ["node", "dist/main.js"]