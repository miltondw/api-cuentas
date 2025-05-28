#!/bin/bash

# 🧪 Script de Testing Completo para Todos los Endpoints
# ======================================================

BASE_URL="http://localhost:5050/api"
ADMIN_TOKEN=""
LAB_TOKEN=""
CLIENT_TOKEN=""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando Testing de Todos los Endpoints${NC}"
echo "================================================="

# Función para mostrar resultados
check_response() {
    local response="$1"
    local test_name="$2"
    local status_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    echo -e "\n${YELLOW}Testing: $test_name${NC}"
    echo "Status Code: $status_code"
    
    if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        echo "Response: $body" | head -c 200
        echo "..."
    elif [[ $status_code -eq 401 ]]; then
        echo -e "${YELLOW}🔒 UNAUTHORIZED (expected for some tests)${NC}"
    elif [[ $status_code -eq 403 ]]; then
        echo -e "${YELLOW}🚫 FORBIDDEN (expected for role tests)${NC}"
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "Response: $body"
    fi
}

# Función para hacer petición con token
api_request() {
    local method="$1"
    local endpoint="$2"
    local token="$3"
    local data="$4"
    
    if [ -z "$token" ]; then
        if [ -z "$data" ]; then
            curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint"
        else
            curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        fi
    else
        if [ -z "$data" ]; then
            curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token"
        else
            curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json" \
                -d "$data"
        fi
    fi
}

echo -e "${BLUE}1. 🔐 Testing Authentication Endpoints${NC}"
echo "================================================="

# Login Admin
echo -e "\n${YELLOW}Testing Admin Login...${NC}"
admin_response=$(api_request "POST" "/auth/login" "" '{"email":"admin@ingeocimyc.com","password":"admin123"}')
check_response "$admin_response" "Admin Login"
ADMIN_TOKEN=$(echo "$admin_response" | head -n -1 | jq -r '.access_token // empty' 2>/dev/null)

# Login Lab
echo -e "\n${YELLOW}Testing Lab Login...${NC}"
lab_response=$(api_request "POST" "/auth/login" "" '{"email":"lab@ingeocimyc.com","password":"lab123"}')
check_response "$lab_response" "Lab Login"
LAB_TOKEN=$(echo "$lab_response" | head -n -1 | jq -r '.access_token // empty' 2>/dev/null)

# Login Client
echo -e "\n${YELLOW}Testing Client Login...${NC}"
client_response=$(api_request "POST" "/auth/login" "" '{"email":"client@ingeocimyc.com","password":"client123"}')
check_response "$client_response" "Client Login"
CLIENT_TOKEN=$(echo "$client_response" | head -n -1 | jq -r '.access_token // empty' 2>/dev/null)

echo -e "\n${BLUE}Tokens obtenidos:${NC}"
echo "Admin Token: ${ADMIN_TOKEN:0:50}..."
echo "Lab Token: ${LAB_TOKEN:0:50}..."
echo "Client Token: ${CLIENT_TOKEN:0:50}..."

echo -e "\n${BLUE}2. 🧪 Testing Lab Module Endpoints (Admin + Lab access)${NC}"
echo "================================================="

# Apiques endpoints
echo -e "\n${YELLOW}Testing Apiques endpoints...${NC}"
check_response "$(api_request "GET" "/lab/apiques" "$ADMIN_TOKEN")" "GET /lab/apiques (Admin)"
check_response "$(api_request "GET" "/lab/apiques" "$LAB_TOKEN")" "GET /lab/apiques (Lab)"
check_response "$(api_request "GET" "/lab/apiques" "$CLIENT_TOKEN")" "GET /lab/apiques (Client - should fail)"

# Profiles endpoints
echo -e "\n${YELLOW}Testing Profiles endpoints...${NC}"
check_response "$(api_request "GET" "/lab/profiles" "$ADMIN_TOKEN")" "GET /lab/profiles (Admin)"
check_response "$(api_request "GET" "/lab/profiles" "$LAB_TOKEN")" "GET /lab/profiles (Lab)"
check_response "$(api_request "GET" "/lab/profiles" "$CLIENT_TOKEN")" "GET /lab/profiles (Client - should fail)"

echo -e "\n${BLUE}3. 🏗️ Testing Project Management Module (Admin only)${NC}"
echo "================================================="

# Projects endpoints
echo -e "\n${YELLOW}Testing Projects endpoints...${NC}"
check_response "$(api_request "GET" "/project-management/projects" "$ADMIN_TOKEN")" "GET /project-management/projects (Admin)"
check_response "$(api_request "GET" "/project-management/projects" "$LAB_TOKEN")" "GET /project-management/projects (Lab - should fail)"
check_response "$(api_request "GET" "/project-management/projects" "$CLIENT_TOKEN")" "GET /project-management/projects (Client - should fail)"

# Financial endpoints
echo -e "\n${YELLOW}Testing Financial endpoints...${NC}"
check_response "$(api_request "GET" "/project-management/financial" "$ADMIN_TOKEN")" "GET /project-management/financial (Admin)"
check_response "$(api_request "GET" "/project-management/financial" "$LAB_TOKEN")" "GET /project-management/financial (Lab - should fail)"
check_response "$(api_request "GET" "/project-management/financial" "$CLIENT_TOKEN")" "GET /project-management/financial (Client - should fail)"

echo -e "\n${BLUE}4. 👥 Testing Client Module (All roles access)${NC}"
echo "================================================="

# Service Requests endpoints
echo -e "\n${YELLOW}Testing Service Requests endpoints...${NC}"
check_response "$(api_request "GET" "/client/service-requests" "$ADMIN_TOKEN")" "GET /client/service-requests (Admin)"
check_response "$(api_request "GET" "/client/service-requests" "$LAB_TOKEN")" "GET /client/service-requests (Lab)"
check_response "$(api_request "GET" "/client/service-requests" "$CLIENT_TOKEN")" "GET /client/service-requests (Client)"

echo -e "\n${BLUE}5. 🛠️ Testing Services Module (Authenticated users)${NC}"
echo "================================================="

check_response "$(api_request "GET" "/services" "$ADMIN_TOKEN")" "GET /services (Admin)"
check_response "$(api_request "GET" "/services" "$LAB_TOKEN")" "GET /services (Lab)"
check_response "$(api_request "GET" "/services" "$CLIENT_TOKEN")" "GET /services (Client)"
check_response "$(api_request "GET" "/services" "")" "GET /services (No token - should fail)"

echo -e "\n${BLUE}6. 📄 Testing PDF Module (Admin only)${NC}"
echo "================================================="

check_response "$(api_request "POST" "/pdf/generate" "$ADMIN_TOKEN" '{"template":"test","data":{}}')" "POST /pdf/generate (Admin)"
check_response "$(api_request "POST" "/pdf/generate" "$LAB_TOKEN" '{"template":"test","data":{}}')" "POST /pdf/generate (Lab - should fail)"
check_response "$(api_request "POST" "/pdf/generate" "$CLIENT_TOKEN" '{"template":"test","data":{}}')" "POST /pdf/generate (Client - should fail)"

echo -e "\n${BLUE}7. 🎯 Testing Specific Endpoint Features${NC}"
echo "================================================="

# Test POST requests with sample data
if [ ! -z "$ADMIN_TOKEN" ]; then
    echo -e "\n${YELLOW}Testing POST endpoints with sample data...${NC}"
    
    # Create service request
    check_response "$(api_request "POST" "/client/service-requests" "$CLIENT_TOKEN" '{
        "name": "Test Service Request",
        "email": "test@example.com",
        "phone": "123456789",
        "company": "Test Company",
        "service": "Test Service",
        "description": "Test description"
    }')" "POST /client/service-requests (Client)"
    
    # Create apique (if admin)
    check_response "$(api_request "POST" "/lab/apiques" "$ADMIN_TOKEN" '{
        "codigo": "TEST001",
        "nombre": "Test Apique",
        "descripcion": "Test description"
    }')" "POST /lab/apiques (Admin)"
fi

echo -e "\n${BLUE}8. 📊 Testing Error Handling${NC}"
echo "================================================="

# Test invalid endpoints
check_response "$(api_request "GET" "/invalid-endpoint" "$ADMIN_TOKEN")" "GET /invalid-endpoint"
check_response "$(api_request "POST" "/auth/login" "" '{"email":"invalid","password":"invalid"}')" "Invalid Login"

echo -e "\n${GREEN}🎉 Testing Complete!${NC}"
echo "================================================="
echo -e "${YELLOW}Summary:${NC}"
echo "✅ Authentication endpoints tested"
echo "✅ Role-based access control tested"
echo "✅ All modules tested (Lab, Project Management, Client, Services, PDF)"
echo "✅ Error handling tested"
echo ""
echo -e "${BLUE}Check the output above for any failed tests.${NC}"
echo -e "${BLUE}Expected: Some 401/403 errors for role-based access control.${NC}"
    
    if echo "$response" | grep -q '"error"\|"statusCode":[45]'; then
        echo -e "${RED}❌ $test_name - FAILED${NC}"
        echo "   Response: $response"
        return 1
    else
        echo -e "${GREEN}✅ $test_name - SUCCESS${NC}"
        return 0
    fi
}

# Función para obtener token
get_token() {
    local email="$1"
    local password="$2"
    local role_name="$3"
    
    echo -e "${YELLOW}🔐 Autenticando usuario $role_name ($email)${NC}"
    
    local response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$response" | grep -q "accessToken"; then
        local token=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Login exitoso para $role_name${NC}"
        echo "$token"
    else
        echo -e "${RED}❌ Login fallido para $role_name${NC}"
        echo "Response: $response"
        echo ""
    fi
}

# ==========================================
# 1. AUTENTICACIÓN
# ==========================================
echo -e "\n${BLUE}📝 SECCIÓN 1: AUTENTICACIÓN${NC}"
echo "================================"

# Obtener tokens (necesitarás proporcionar las contraseñas reales)
ADMIN_TOKEN=$(get_token "eider@ingeocimyc.com" "tu_password_admin" "ADMIN")
LAB_TOKEN=$(get_token "milton@ingeocimyc.com" "tu_password_lab" "LAB")

# Si no tienes un usuario client, puedes crear uno
echo -e "${YELLOW}📝 Intentando crear usuario client de prueba${NC}"
CLIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"Cliente Test","email":"client.test@ingeocimyc.com","password":"test123456"}')

if echo "$CLIENT_RESPONSE" | grep -q "accessToken"; then
    CLIENT_TOKEN=$(echo "$CLIENT_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Usuario client creado y autenticado${NC}"
else
    echo -e "${YELLOW}⚠️ No se pudo crear usuario client (probablemente ya existe)${NC}"
    CLIENT_TOKEN=$(get_token "client.test@ingeocimyc.com" "test123456" "CLIENT")
fi

# ==========================================
# 2. SERVICIOS (PÚBLICO/AUTENTICADO)
# ==========================================
echo -e "\n${BLUE}📝 SECCIÓN 2: SERVICIOS${NC}"
echo "=========================="

# Obtener todos los servicios
echo -e "${YELLOW}🔍 GET /api/services${NC}"
SERVICES_RESPONSE=$(curl -s -X GET "$BASE_URL/services")
check_response "$SERVICES_RESPONSE" "Obtener servicios"

# Obtener categorías de servicios
echo -e "${YELLOW}🔍 GET /api/services/categories${NC}"
CATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/services/categories")
check_response "$CATEGORIES_RESPONSE" "Obtener categorías"

# ==========================================
# 3. MÓDULO CLIENT (Service Requests)
# ==========================================
echo -e "\n${BLUE}📝 SECCIÓN 3: MÓDULO CLIENT${NC}"
echo "=============================="

if [ -n "$CLIENT_TOKEN" ]; then
    # Crear solicitud de servicio
    echo -e "${YELLOW}📝 POST /api/client/service-requests${NC}"
    CREATE_REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/client/service-requests" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CLIENT_TOKEN" \
        -d '{
            "name": "Juan Pérez Test",
            "nameProject": "Proyecto Test API",
            "location": "Bogotá, Colombia",
            "identification": "12345678",
            "phone": "3001234567",
            "email": "test@example.com",
            "description": "Solicitud de prueba para testing de API",
            "services": [1, 2]
        }')
    check_response "$CREATE_REQUEST_RESPONSE" "Crear solicitud de servicio"
    
    # Obtener todas las solicitudes
    echo -e "${YELLOW}🔍 GET /api/client/service-requests${NC}"
    GET_REQUESTS_RESPONSE=$(curl -s -X GET "$BASE_URL/client/service-requests" \
        -H "Authorization: Bearer $CLIENT_TOKEN")
    check_response "$GET_REQUESTS_RESPONSE" "Obtener solicitudes de servicio"
    
    # Obtener solicitud específica (ID 1)
    echo -e "${YELLOW}🔍 GET /api/client/service-requests/1${NC}"
    GET_REQUEST_RESPONSE=$(curl -s -X GET "$BASE_URL/client/service-requests/1" \
        -H "Authorization: Bearer $CLIENT_TOKEN")
    check_response "$GET_REQUEST_RESPONSE" "Obtener solicitud específica"
else
    echo -e "${RED}❌ No se puede probar módulo CLIENT - Token no disponible${NC}"
fi

# ==========================================
# 4. MÓDULO LAB (Apiques y Perfiles)
# ==========================================
echo -e "\n${BLUE}📝 SECCIÓN 4: MÓDULO LAB${NC}"
echo "=========================="

if [ -n "$LAB_TOKEN" ]; then
    # Probar Apiques
    echo -e "${YELLOW}🔍 GET /api/lab/apiques/project/1${NC}"
    APIQUES_RESPONSE=$(curl -s -X GET "$BASE_URL/lab/apiques/project/1" \
        -H "Authorization: Bearer $LAB_TOKEN")
    check_response "$APIQUES_RESPONSE" "Obtener apiques del proyecto 1"
    
    # Crear apique de prueba
    echo -e "${YELLOW}📝 POST /api/lab/apiques${NC}"
    CREATE_APIQUE_RESPONSE=$(curl -s -X POST "$BASE_URL/lab/apiques" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $LAB_TOKEN" \
        -d '{
            "project_id": 1,
            "numero_apique": "AP-TEST-001",
            "cota_inicial": 100.5,
            "cota_final": 95.0,
            "profundidad_total": 5.5,
            "ubicacion": "Ubicación test",
            "observaciones": "Apique de prueba para testing"
        }')
    check_response "$CREATE_APIQUE_RESPONSE" "Crear apique"
    
    # Probar Perfiles
    echo -e "${YELLOW}🔍 GET /api/lab/profiles${NC}"
    PROFILES_RESPONSE=$(curl -s -X GET "$BASE_URL/lab/profiles" \
        -H "Authorization: Bearer $LAB_TOKEN")
    check_response "$PROFILES_RESPONSE" "Obtener perfiles"
    
    # Crear perfil de prueba
    echo -e "${YELLOW}📝 POST /api/lab/profiles${NC}"
    CREATE_PROFILE_RESPONSE=$(curl -s -X POST "$BASE_URL/lab/profiles" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $LAB_TOKEN" \
        -d '{
            "project_id": 1,
            "sondeo_numero": "S-TEST-001",
            "coordenada_norte": 1000000,
            "coordenada_este": 2000000,
            "cota_inicial": 100.0,
            "profundidad_perforada": 10.0,
            "nivel_freatico": 3.5,
            "fecha_inicio": "2025-05-28",
            "fecha_fin": "2025-05-28"
        }')
    check_response "$CREATE_PROFILE_RESPONSE" "Crear perfil"
else
    echo -e "${RED}❌ No se puede probar módulo LAB - Token no disponible${NC}"
fi

# ==========================================
# 5. MÓDULO PROJECT MANAGEMENT (Solo Admin)
# ==========================================
echo -e "\n${BLUE}📝 SECCIÓN 5: PROJECT MANAGEMENT${NC}"
echo "=================================="

if [ -n "$ADMIN_TOKEN" ]; then
    # Proyectos
    echo -e "${YELLOW}🔍 GET /api/project-management/projects${NC}"
    PROJECTS_RESPONSE=$(curl -s -X GET "$BASE_URL/project-management/projects" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    check_response "$PROJECTS_RESPONSE" "Obtener proyectos"
    
    # Crear proyecto
    echo -e "${YELLOW}📝 POST /api/project-management/projects${NC}"
    CREATE_PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/project-management/projects" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{
            "client_name": "Cliente Test API",
            "project_name": "Proyecto Test API",
            "location": "Ubicación Test",
            "start_date": "2025-05-28",
            "estimated_end_date": "2025-06-28",
            "budget": 50000000,
            "description": "Proyecto de prueba para testing de API"
        }')
    check_response "$CREATE_PROJECT_RESPONSE" "Crear proyecto"
    
    # Gastos de empresa
    echo -e "${YELLOW}🔍 GET /api/project-management/financial/expenses${NC}"
    EXPENSES_RESPONSE=$(curl -s -X GET "$BASE_URL/project-management/financial/expenses?year=2025" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    check_response "$EXPENSES_RESPONSE" "Obtener gastos de empresa"
    
    # Crear gastos de empresa
    echo -e "${YELLOW}📝 POST /api/project-management/financial/expenses${NC}"
    CREATE_EXPENSES_RESPONSE=$(curl -s -X POST "$BASE_URL/project-management/financial/expenses" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{
            "year": 2025,
            "month": 5,
            "nomina": 15000000,
            "seguridad_social": 3000000,
            "arriendos": 2000000,
            "servicios_publicos": 500000,
            "papeleria": 200000,
            "comunicaciones": 300000,
            "combustible": 800000,
            "aportes_salud": 1500000,
            "otros_gastos": 500000
        }')
    check_response "$CREATE_EXPENSES_RESPONSE" "Crear gastos de empresa"
    
    # Resumen financiero
    echo -e "${YELLOW}🔍 GET /api/project-management/financial/summary?year=2025${NC}"
    SUMMARY_RESPONSE=$(curl -s -X GET "$BASE_URL/project-management/financial/summary?year=2025" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    check_response "$SUMMARY_RESPONSE" "Obtener resumen financiero"
else
    echo -e "${RED}❌ No se puede probar PROJECT MANAGEMENT - Token admin no disponible${NC}"
fi

# ==========================================
# 6. CONTROL DE ACCESO (Verificar que los roles funcionen)
# ==========================================
echo -e "\n${BLUE}📝 SECCIÓN 6: CONTROL DE ACCESO${NC}"
echo "================================="

# Lab user intentando acceder a endpoints de admin (debe fallar)
if [ -n "$LAB_TOKEN" ]; then
    echo -e "${YELLOW}🚫 Lab user intentando acceder a project management (debe fallar)${NC}"
    LAB_ADMIN_ACCESS=$(curl -s -X GET "$BASE_URL/project-management/projects" \
        -H "Authorization: Bearer $LAB_TOKEN")
    
    if echo "$LAB_ADMIN_ACCESS" | grep -q "Forbidden\|403"; then
        echo -e "${GREEN}✅ Control de acceso funcionando - Lab user correctamente bloqueado${NC}"
    else
        echo -e "${RED}❌ Control de acceso fallando - Lab user tiene acceso indebido${NC}"
    fi
fi

# Client user intentando acceder a endpoints de lab (debe fallar)
if [ -n "$CLIENT_TOKEN" ]; then
    echo -e "${YELLOW}🚫 Client user intentando acceder a lab endpoints (debe fallar)${NC}"
    CLIENT_LAB_ACCESS=$(curl -s -X GET "$BASE_URL/lab/apiques/project/1" \
        -H "Authorization: Bearer $CLIENT_TOKEN")
    
    if echo "$CLIENT_LAB_ACCESS" | grep -q "Forbidden\|403"; then
        echo -e "${GREEN}✅ Control de acceso funcionando - Client user correctamente bloqueado${NC}"
    else
        echo -e "${RED}❌ Control de acceso fallando - Client user tiene acceso indebido${NC}"
    fi
fi

# ==========================================
# 7. PDF GENERATION (Solo Admin)
# ==========================================
echo -e "\n${BLUE}📝 SECCIÓN 7: GENERACIÓN DE PDF${NC}"
echo "================================"

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}📄 POST /api/pdf/generate-service-request${NC}"
    PDF_RESPONSE=$(curl -s -X POST "$BASE_URL/pdf/generate-service-request" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{"serviceRequestId": 1}')
    check_response "$PDF_RESPONSE" "Generar PDF de solicitud"
else
    echo -e "${RED}❌ No se puede probar PDF GENERATION - Token admin no disponible${NC}"
fi

# ==========================================
# RESUMEN FINAL
# ==========================================
echo -e "\n${BLUE}📊 RESUMEN DE TESTING${NC}"
echo "======================"
echo -e "${GREEN}✅ Testing completado${NC}"
echo ""
echo -e "${YELLOW}📋 Para usar este script:${NC}"
echo "1. Actualiza las contraseñas reales en las variables"
echo "2. Ejecuta el script: ./test-endpoints.sh"
echo "3. Revisa los resultados para cada sección"
echo ""
echo -e "${BLUE}🌐 Documentación Swagger disponible en:${NC}"
echo "   http://localhost:5050/api/docs"
