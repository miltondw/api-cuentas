#!/bin/bash

echo "🔐 Probando autenticación completa..."
echo ""

# 1. Login
echo "1. Haciendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "milton@ingeocimyc.com", "password": "Ingeocimyc.1089"}')

echo "Respuesta del login:"
echo $LOGIN_RESPONSE | jq .
echo ""

# 2. Extraer token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
echo "Token extraído: ${TOKEN:0:50}..."
echo ""

# 3. Usar token en endpoint protegido
echo "2. Probando endpoint protegido con token..."
curl -s -X GET http://localhost:5050/api/service-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo "✅ Prueba completada!"
