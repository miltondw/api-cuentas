#!/bin/bash

# Script principal para ejecutar todas las pruebas

# Colores para mejor legibilidad
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== EJECUTANDO PRUEBAS DE ESTRUCTURA DE BASE DE DATOS =====${NC}"
node scripts/verify-tables-structure.js

echo -e "\n${YELLOW}===== EJECUTANDO PRUEBAS DE API =====${NC}"
node scripts/test-api.js

echo -e "\n${GREEN}===== TODAS LAS PRUEBAS COMPLETADAS =====${NC}"
