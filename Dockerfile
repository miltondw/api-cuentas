# Dockerfile

# ---- Etapa de Build ----
# Usamos una imagen de Node para construir el proyecto
FROM node:18-alpine AS builder

# Establecemos el directorio de trabajo
WORKDIR /usr/src/app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos todo el código fuente
COPY . .

# Construimos la aplicación de NestJS
RUN npm run build


# ---- Etapa de Producción ----
# Usamos una imagen de Node que ya incluye las dependencias para Puppeteer
FROM ghcr.io/puppeteer/puppeteer:22.15.0 AS production

# Variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

# Copiamos las dependencias de producción y el código compilado desde la etapa de 'builder'
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist

# Exponemos el puerto que Render nos asignará
# La variable PORT es inyectada automáticamente por Render
EXPOSE $PORT

# El comando para iniciar la aplicación
CMD ["node", "dist/main.js"]
