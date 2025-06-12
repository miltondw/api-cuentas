#!/bin/bash
# Script para verificar los endpoints de autenticación y tablas de la base de datos

# Colores para la salida
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}       PRUEBA DE AUTENTICACIÓN API       ${NC}"
echo -e "${YELLOW}=========================================${NC}"

# Verificar que node esté instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js no está instalado${NC}"
    exit 1
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules/axios" ]; then
    echo -e "${YELLOW}Instalando dependencias...${NC}"
    npm install axios dotenv --save-dev
fi

# Ejecutar el script de prueba de endpoints
echo -e "${YELLOW}Ejecutando prueba de endpoints de autenticación...${NC}"
node scripts/test-auth-endpoints.js

# Comprobar si la ejecución fue exitosa
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ La prueba de endpoints se completó correctamente${NC}"
else
    echo -e "${RED}❌ Hubo problemas durante la prueba de endpoints${NC}"
fi

echo -e "${YELLOW}=========================================${NC}"
echo -e "${GREEN}¡Pruebas completadas!${NC}"
