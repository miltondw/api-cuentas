#!/bin/bash

# Script para probar los endpoints de la API
# Este script verifica la autenticación, roles y funcionalidad básica de la API
# Utiliza las variables EMAIL y EMAIL_PASSWORD del archivo .env para el usuario admin

# Cargar variables de entorno desde .env
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
  echo "Variables de entorno cargadas correctamente"
else
  echo "Error: Archivo .env no encontrado"
  exit 1
fi

# Verificar que las variables necesarias estén definidas
if [ -z "$EMAIL" ] || [ -z "$EMAIL_PASSWORD" ]; then
  echo "Error: Las variables EMAIL y EMAIL_PASSWORD deben estar definidas en el archivo .env"
  exit 1
fi

# Colores para mejor legibilidad
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base de la API (ajustar según entorno)
API_URL="http://localhost:5051/api"

# Variables para almacenar tokens
ADMIN_TOKEN=""
LAB_TOKEN=""
CLIENT_TOKEN=""

# Credenciales de prueba
ADMIN_EMAIL="$EMAIL"
ADMIN_PASSWORD="$EMAIL_PASSWORD"
LAB_EMAIL="lab@test.com"
LAB_PASSWORD="Lab123!"
CLIENT_EMAIL="client@test.com"
CLIENT_PASSWORD="Client123!"

# Función para mostrar mensajes
log_message() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Función para mostrar mensajes de éxito
log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Función para mostrar mensajes de error
log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Función para mostrar títulos de secciones
log_section() {
  echo -e "\n${YELLOW}===== $1 =====${NC}"
}

# Función para probar la salud de la API
test_health() {
  log_section "Prueba de estado de salud (Health Check)"
  
  response=$(curl -s "${API_URL}/health")
  if [[ "$response" == *"status"* && "$response" == *"ok"* ]]; then
    log_success "API en funcionamiento: $response"
  else
    log_error "API no responde correctamente: $response"
    exit 1
  fi
}

# Función para registrar un usuario
register_user() {
  local email=$1
  local password=$2
  local name=$3

  log_message "Intentando registrar usuario: $email"
  
  local response=$(curl -s -X POST "${API_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"name\":\"$name\"}")
  
  if [[ "$response" == *"accessToken"* ]]; then
    log_success "Usuario registrado exitosamente: $email"
    echo "$response" | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$'
  else
    log_message "Usuario ya existe o error en registro: $response"
    echo ""
  fi
}

# Función para iniciar sesión
login() {
  local email=$1
  local password=$2
  
  log_message "Intentando iniciar sesión con: $email"
  
  local response=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  
  if [[ "$response" == *"accessToken"* ]]; then
    log_success "Inicio de sesión exitoso: $email"
    echo "$response" | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$'
  else
    log_error "Error en inicio de sesión: $response"
    echo ""
  fi
}

# Función para probar un endpoint protegido
test_protected_endpoint() {
  local token=$1
  local endpoint=$2
  local description=$3
  
  log_message "Probando endpoint protegido: $endpoint ($description)"
  
  local response=$(curl -s -X GET "${API_URL}${endpoint}" \
    -H "Authorization: Bearer $token")
  
  if [[ "$response" == *"Unauthorized"* || "$response" == *"Forbidden"* ]]; then
    log_error "Acceso denegado: $response"
    return 1
  else
    log_success "Acceso permitido: $endpoint"
    echo "$response"
    return 0
  fi
}

# Función para probar permisos específicos por rol
test_role_permissions() {
  local token=$1
  local role=$2
  
  log_section "Probando permisos para rol: $role"
  
  # Endpoints comunes que todos los roles pueden acceder
  test_protected_endpoint "$token" "/auth/profile" "Perfil de usuario"
  
  # Endpoints específicos por rol
  case $role in
    "admin")
      test_protected_endpoint "$token" "/admin/users" "Listado de usuarios (Admin)" || true
      ;;
    "lab")
      test_protected_endpoint "$token" "/lab/profiles" "Perfiles de laboratorio (Lab)" || true
      ;;
    "client")
      test_protected_endpoint "$token" "/client/projects" "Proyectos del cliente (Client)" || true
      ;;
  esac
}

# Función para probar la tabla auth_logs
test_auth_logs() {
  log_section "Verificando registros en auth_logs"
  
  # Este endpoint debería devolver los últimos logs de autenticación (solo admin)
  local response=$(curl -s -X GET "${API_URL}/admin/logs" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  if [[ "$response" == *"auth_logs"* || "$response" == *"authLogs"* ]]; then
    log_success "Tabla auth_logs funcionando correctamente"
  else
    log_message "No se pudo verificar auth_logs directamente: $response"
    # Alternativa: verificamos que al menos haya información de sesión
    test_protected_endpoint "$ADMIN_TOKEN" "/auth/sessions" "Sesiones activas"
  fi
}

# Función para probar una operación de fallo de inicio de sesión
test_failed_login() {
  log_section "Probando manejo de intentos fallidos de inicio de sesión"
  
  local email="nonexistent@example.com"
  local password="WrongPassword123!"
  
  log_message "Intentando iniciar sesión con credenciales incorrectas"
  
  local response=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  
  if [[ "$response" == *"Unauthorized"* || "$response" == *"credenciales"* || "$response" == *"credentials"* ]]; then
    log_success "Manejo correcto de intento fallido: $response"
  else
    log_error "Respuesta inesperada para intento fallido: $response"
  fi
}

# Función para cerrar sesión
test_logout() {
  local token=$1
  
  log_section "Probando cierre de sesión"
  
  local response=$(curl -s -X POST "${API_URL}/auth/logout" \
    -H "Authorization: Bearer $token")
  
  if [[ "$response" == *"success"* || "$response" == *"ok"* ]]; then
    log_success "Cierre de sesión exitoso"
  else
    log_message "Respuesta de cierre de sesión: $response"
  fi
}

# Función para ejecutar todas las pruebas
run_tests() {
  log_section "INICIANDO PRUEBAS DE API"
  
  # Verificar que la API esté en funcionamiento
  test_health
  
  # Intentar iniciar sesión con los usuarios de prueba
  ADMIN_TOKEN=$(login "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
  if [[ -z "$ADMIN_TOKEN" ]]; then
    log_message "Intentando registrar usuario admin"
    ADMIN_TOKEN=$(register_user "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "Admin User")
  fi
  
  LAB_TOKEN=$(login "$LAB_EMAIL" "$LAB_PASSWORD")
  if [[ -z "$LAB_TOKEN" ]]; then
    log_message "Intentando registrar usuario lab"
    LAB_TOKEN=$(register_user "$LAB_EMAIL" "$LAB_PASSWORD" "Lab User")
  fi
  
  CLIENT_TOKEN=$(login "$CLIENT_EMAIL" "$CLIENT_PASSWORD")
  if [[ -z "$CLIENT_TOKEN" ]]; then
    log_message "Intentando registrar usuario cliente"
    CLIENT_TOKEN=$(register_user "$CLIENT_EMAIL" "$CLIENT_PASSWORD" "Client User")
  fi
  
  # Si tenemos tokens, probamos permisos por rol
  if [[ ! -z "$ADMIN_TOKEN" ]]; then
    test_role_permissions "$ADMIN_TOKEN" "admin"
  else
    log_error "No se pudo obtener token de admin para pruebas"
  fi
  
  if [[ ! -z "$LAB_TOKEN" ]]; then
    test_role_permissions "$LAB_TOKEN" "lab"
  else
    log_error "No se pudo obtener token de lab para pruebas"
  fi
  
  if [[ ! -z "$CLIENT_TOKEN" ]]; then
    test_role_permissions "$CLIENT_TOKEN" "client"
  else
    log_error "No se pudo obtener token de cliente para pruebas"
  fi
  
  # Probar manejo de intentos fallidos
  test_failed_login
  
  # Probar tabla de logs de autenticación
  if [[ ! -z "$ADMIN_TOKEN" ]]; then
    test_auth_logs
  fi
  
  # Probar logout
  if [[ ! -z "$ADMIN_TOKEN" ]]; then
    test_logout "$ADMIN_TOKEN"
  fi
  
  log_section "PRUEBAS COMPLETADAS"
}

# Ejecutar todas las pruebas
run_tests
