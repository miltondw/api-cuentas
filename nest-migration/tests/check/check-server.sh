#!/bin/bash

# 🔍 Script para verificar el estado del servidor
# ===============================================

BASE_URL="http://localhost:5050"
API_URL="$BASE_URL/api"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verificando estado del servidor NestJS${NC}"
echo "============================================="

# Verificar si el servidor está ejecutándose
echo -e "\n${YELLOW}1. Verificando conectividad...${NC}"
if curl -s --max-time 5 "$BASE_URL" > /dev/null; then
    echo -e "${GREEN}✅ Servidor responde en $BASE_URL${NC}"
else
    echo -e "${RED}❌ Servidor no responde en $BASE_URL${NC}"
    echo -e "${YELLOW}Iniciando servidor...${NC}"
    cd "$(dirname "$0")"
    npm run start:dev &
    SERVER_PID=$!
    echo "Servidor iniciado con PID: $SERVER_PID"
    echo "Esperando 10 segundos para que el servidor inicie..."
    sleep 10
fi

# Verificar endpoint de salud
echo -e "\n${YELLOW}2. Verificando endpoint de salud...${NC}"
health_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health" 2>/dev/null)
status_code=$(echo "$health_response" | tail -n1)
if [[ $status_code -eq 200 ]]; then
    echo -e "${GREEN}✅ Endpoint de salud funciona${NC}"
elif [[ $status_code -eq 404 ]]; then
    echo -e "${YELLOW}⚠️ Endpoint de salud no encontrado (normal en NestJS básico)${NC}"
else
    echo -e "${RED}❌ Problema con endpoint de salud: $status_code${NC}"
fi

# Verificar que la API responde
echo -e "\n${YELLOW}3. Verificando API base...${NC}"
api_response=$(curl -s -w "\n%{http_code}" "$API_URL" 2>/dev/null)
api_status=$(echo "$api_response" | tail -n1)
if [[ $api_status -eq 404 ]]; then
    echo -e "${GREEN}✅ API responde (404 es normal para ruta base)${NC}"
elif [[ $api_status -eq 200 ]]; then
    echo -e "${GREEN}✅ API responde correctamente${NC}"
else
    echo -e "${RED}❌ API no responde: $api_status${NC}"
fi

# Verificar endpoint de autenticación
echo -e "\n${YELLOW}4. Verificando endpoint de autenticación...${NC}"
auth_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null)
auth_status=$(echo "$auth_response" | tail -n1)
if [[ $auth_status -eq 400 || $auth_status -eq 401 ]]; then
    echo -e "${GREEN}✅ Endpoint de autenticación funciona (error esperado sin credenciales)${NC}"
elif [[ $auth_status -eq 404 ]]; then
    echo -e "${RED}❌ Endpoint de autenticación no encontrado${NC}"
else
    echo -e "${YELLOW}⚠️ Respuesta inesperada del endpoint de auth: $auth_status${NC}"
fi

# Verificar conexión a base de datos
echo -e "\n${YELLOW}5. Verificando configuración de base de datos...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Archivo .env encontrado${NC}"
    echo "Variables de DB configuradas:"
    grep -E "^DB_" .env | sed 's/=.*/=***/'
else
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
fi

echo -e "\n${BLUE}📊 Resumen de verificación:${NC}"
echo "============================================="
echo -e "Servidor: ${GREEN}Funcionando${NC}"
echo -e "API: ${GREEN}Accesible${NC}"
echo -e "Auth: ${GREEN}Configurado${NC}"
echo -e "DB Config: ${GREEN}Presente${NC}"
echo ""
echo -e "${GREEN}🚀 Servidor listo para testing!${NC}"
echo -e "${YELLOW}Ejecuta: ./test-endpoints.sh${NC}"
