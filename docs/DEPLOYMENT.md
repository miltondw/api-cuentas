# Deployment Guide - API Cuentas Ingeocimyc

## 🚀 Opciones de Deployment

### 1. Render (Recomendado para Producción)

### 2. Docker Local

### 3. VPS/Servidor Dedicado

### 4. Heroku

### 5. AWS/Google Cloud

---

## 🌐 Deployment en Render

### Configuración Automática

El proyecto incluye `render.yaml` para deployment automático:

```yaml
services:
  - type: web
    name: api-cuentas-ingeocimyc
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5051
```

### Variables de Entorno en Render

```env
# Base de Datos (usar PlanetScale, Railway, o similar)
DB_HOST=your-db-host.com
DB_PORT=3306
DB_USERNAME=your-username
DB_PASSWORD=your-secure-password
DB_DATABASE=api_cuentas_prod

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-chars
JWT_EXPIRES_IN=24h

# Application
NODE_ENV=production
PORT=5051
APP_NAME=API Cuentas Ingeocimyc

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
TRUST_PROXY=true

# SSL/HTTPS (Render automático)
FORCE_HTTPS=true
```

### Pasos para Deploy en Render

1. **Conectar Repositorio**

   ```bash
   # Push tu código a GitHub
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Crear Servicio en Render**

   - Ir a [Render Dashboard](https://dashboard.render.com)
   - New → Web Service
   - Conectar tu repositorio GitHub
   - Render detectará automáticamente `render.yaml`

3. **Configurar Base de Datos**

   ```sql
   -- Crear usuario de producción
   CREATE USER 'api_prod'@'%' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON api_cuentas_prod.* TO 'api_prod'@'%';
   FLUSH PRIVILEGES;
   ```

4. **Ejecutar Migraciones**
   ```bash
   # Conectar a la instancia de Render
   npm run typeorm:migration:run
   ```

---

## 🐳 Docker Deployment

### Dockerfile Optimizado

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy additional files
COPY templates/ ./templates/
COPY assets/ ./assets/

# Create uploads directory
RUN mkdir -p uploads/pdfs && chown -R nestjs:nodejs uploads

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 5051

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/main.js || exit 1

# Start application
CMD ["node", "dist/main.js"]
```

### Docker Compose para Desarrollo

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '5051:5051'
    environment:
      - NODE_ENV=development
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USERNAME=root
      - DB_PASSWORD=password
      - DB_DATABASE=api_cuentas_dev
      - JWT_SECRET=dev-jwt-secret-key-for-testing-only
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: api_cuentas_dev
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    restart: unless-stopped

volumes:
  mysql_data:
```

### Comandos Docker

```bash
# Build imagen
docker build -t api-cuentas:latest .

# Run con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Ejecutar migraciones
docker-compose exec api npm run typeorm:migration:run

# Backup de base de datos
docker-compose exec mysql mysqldump -u root -p api_cuentas_dev > backup.sql
```

---

## 🖥️ VPS/Servidor Dedicado

### Prerequisitos del Servidor

```bash
# Ubuntu 22.04 LTS recomendado
# Mínimo 2GB RAM, 2 CPU cores, 20GB storage

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Instalar Nginx
sudo apt install nginx -y

# Instalar certbot para SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Configuración del Servidor

1. **Clonar Repositorio**

   ```bash
   cd /var/www
   sudo git clone https://github.com/tu-usuario/api-cuentas.git
   cd api-cuentas
   sudo chown -R $USER:$USER /var/www/api-cuentas
   ```

2. **Instalar Dependencias**

   ```bash
   npm install
   npm run build
   ```

3. **Configurar Variables de Entorno**

   ```bash
   sudo nano /var/www/api-cuentas/.env.production
   ```

4. **Configurar PM2**

   ```bash
   # ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'api-cuentas',
       script: './dist/main.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'development',
         PORT: 5051
       },
       env_production: {
         NODE_ENV: 'production',
         PORT: 5051
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };

   # Iniciar aplicación
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

### Configuración de Nginx

```nginx
# /etc/nginx/sites-available/api-cuentas
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://localhost:5051;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (si los tienes)
    location /uploads/ {
        alias /var/www/api-cuentas/uploads/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/api-cuentas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL con Let's Encrypt
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

---

## 📊 Monitoreo y Logging

### PM2 Monitoring

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs

# Monitoreo con PM2 Plus
pm2 plus
```

### Configuración de Logs

```bash
# Crear directorio de logs
mkdir -p /var/www/api-cuentas/logs

# Configurar logrotate
sudo nano /etc/logrotate.d/api-cuentas
```

```
/var/www/api-cuentas/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    copytruncate
    create 644 www-data www-data
}
```

### Alertas con Monit

```bash
# Instalar monit
sudo apt install monit -y

# Configurar monit
sudo nano /etc/monit/conf.d/api-cuentas
```

```
check process api-cuentas with pidfile /var/www/api-cuentas/api-cuentas.pid
    start program = "/usr/bin/pm2 start /var/www/api-cuentas/ecosystem.config.js"
    stop program = "/usr/bin/pm2 stop api-cuentas"
    if failed host localhost port 5051 then restart
    if 5 restarts within 5 cycles then timeout
```

---

## 🔒 SSL/TLS y Seguridad

### Configuración SSL

```bash
# Renovación automática de certificados
sudo crontab -e

# Agregar línea:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall UFW

```bash
# Configurar firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3306  # Solo si MySQL está en el mismo servidor

# Ver estado
sudo ufw status
```

### Fail2Ban para Protección

```bash
# Instalar fail2ban
sudo apt install fail2ban -y

# Configurar
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

---

## 🧪 Testing del Deployment

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

API_URL="https://tu-dominio.com"

echo "Testing API Health..."

# Basic health check
curl -f $API_URL/ || exit 1
echo "✅ Basic health check passed"

# Database health check
curl -f $API_URL/health || exit 1
echo "✅ Database health check passed"

# Authentication test
curl -f -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}' \
  -w "%{http_code}" | grep -q "401" || exit 1
echo "✅ Authentication endpoint working"

echo "🎉 All health checks passed!"
```

### Load Testing

```bash
# Instalar wrk
sudo apt install wrk -y

# Test básico
wrk -t12 -c400 -d30s https://tu-dominio.com/

# Test con script
wrk -t12 -c400 -d30s -s post.lua https://tu-dominio.com/auth/login
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/api-cuentas
            git pull origin main
            npm install
            npm run build
            pm2 restart api-cuentas
```

---

## 📋 Checklist de Deployment

### Pre-deployment

- [ ] Tests pasan en local
- [ ] Variables de entorno configuradas
- [ ] Base de datos configurada
- [ ] SSL/TLS configurado
- [ ] Backup de datos importante

### Durante Deployment

- [ ] Aplicación se inicia correctamente
- [ ] Health checks pasan
- [ ] Logs no muestran errores críticos
- [ ] Performance es aceptable

### Post-deployment

- [ ] Monitoreo configurado
- [ ] Alertas funcionando
- [ ] Backup automático configurado
- [ ] Documentación actualizada

---

## 🆘 Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos**

   ```bash
   # Verificar conexión
   mysql -h $DB_HOST -u $DB_USERNAME -p $DB_DATABASE

   # Verificar variables de entorno
   printenv | grep DB_
   ```

2. **Aplicación no inicia**

   ```bash
   # Ver logs de PM2
   pm2 logs api-cuentas

   # Ver logs de sistema
   sudo journalctl -u nginx -f
   ```

3. **Performance lenta**

   ```bash
   # Ver uso de recursos
   htop

   # Ver conexiones de base de datos
   mysql -e "SHOW PROCESSLIST;"
   ```

---

_Esta guía cubre los aspectos principales del deployment. Para configuraciones específicas o problemas particulares, consulta la documentación de cada plataforma._
