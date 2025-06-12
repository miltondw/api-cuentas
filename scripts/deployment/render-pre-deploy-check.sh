#!/bin/bash

# Verificación previa al despliegue en Render
# Este script comprueba que todo esté correctamente configurado para el despliegue en Render

echo "🔍 Iniciando verificación previa al despliegue en Render..."

# Verificar archivo package.json
echo "📦 Verificando package.json..."
if [ ! -f "package.json" ]; then
  echo "❌ ERROR: No se encuentra package.json"
  exit 1
fi

# Verificar scripts necesarios
echo "🔍 Verificando scripts en package.json..."
REQUIRED_SCRIPTS=("build" "start" "start:prod")
MISSING_SCRIPTS=()

for script in "${REQUIRED_SCRIPTS[@]}"; do
  if ! grep -q "\"$script\":" package.json; then
    MISSING_SCRIPTS+=("$script")
  fi
done

if [ ${#MISSING_SCRIPTS[@]} -gt 0 ]; then
  echo "❌ ERROR: Faltan los siguientes scripts en package.json: ${MISSING_SCRIPTS[*]}"
  exit 1
else
  echo "✅ Todos los scripts necesarios están definidos"
fi

# Verificar dependencias de NestJS
echo "📚 Verificando dependencias de NestJS..."
if ! grep -q "\"@nestjs/core\":" package.json; then
  echo "❌ ERROR: No se encuentra @nestjs/core en las dependencias"
  exit 1
fi

# Verificar script de construcción de Render
echo "🛠️ Verificando script de construcción para Render..."
RENDER_BUILD_SCRIPT="scripts/deployment/render-build.sh"
if [ ! -f "$RENDER_BUILD_SCRIPT" ]; then
  echo "❌ ERROR: No se encuentra el script $RENDER_BUILD_SCRIPT"
  exit 1
fi

# Verificar permisos de ejecución
if [ ! -x "$RENDER_BUILD_SCRIPT" ]; then
  echo "⚠️ ADVERTENCIA: El script $RENDER_BUILD_SCRIPT no tiene permisos de ejecución"
  echo "🔧 Aplicando permisos de ejecución..."
  chmod +x "$RENDER_BUILD_SCRIPT"
  echo "✅ Permisos aplicados"
fi

# Verificar problemas en el código TypeScript
echo "🔍 Verificando posibles problemas de TypeScript..."
TS_FILES_WITH_AUTHENTICATEDREQUEST=$(grep -l "AuthenticatedRequest" --include="*.ts" -r src)

if [ -n "$TS_FILES_WITH_AUTHENTICATEDREQUEST" ]; then
  echo "ℹ️ Archivos que usan AuthenticatedRequest:"
  echo "$TS_FILES_WITH_AUTHENTICATEDREQUEST"
  
  for file in $TS_FILES_WITH_AUTHENTICATEDREQUEST; do
    if grep -q "req\.headers" "$file"; then
      echo "⚠️ ADVERTENCIA: El archivo $file usa 'req.headers' con AuthenticatedRequest"
      echo "   Esto puede causar errores de compilación en Render"
    fi
  done
fi

# Verificar configuración de Render.yaml
echo "📄 Verificando configuración de Render..."
if [ ! -f "render.yaml" ]; then
  echo "⚠️ ADVERTENCIA: No se encuentra render.yaml. Render usará la configuración predeterminada."
else
  echo "✅ render.yaml encontrado"
  
  # Verificar el nombre del servicio
  if ! grep -q "name:" render.yaml; then
    echo "⚠️ ADVERTENCIA: No se ha definido un nombre de servicio en render.yaml"
  fi
  
  # Verificar el comando de inicio
  if ! grep -q "startCommand:" render.yaml; then
    echo "⚠️ ADVERTENCIA: No se ha definido un comando de inicio en render.yaml"
  fi
fi

# Verificar variables de entorno necesarias
echo "🔐 Verificando variables de entorno críticas..."
ENV_VARS=("DATABASE_URL" "JWT_SECRET" "PORT")
MISSING_ENV=()

for var in "${ENV_VARS[@]}"; do
  if ! grep -q "$var" .env* 2>/dev/null && ! grep -q "$var" render.yaml 2>/dev/null; then
    MISSING_ENV+=("$var")
  fi
done

if [ ${#MISSING_ENV[@]} -gt 0 ]; then
  echo "⚠️ ADVERTENCIA: Las siguientes variables de entorno podrían faltar: ${MISSING_ENV[*]}"
  echo "   Asegúrate de que estén configuradas en el panel de Render."
fi

# Ejecutar compilación de prueba
echo "🧪 Ejecutando compilación de prueba..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Compilación exitosa"
else
  echo "❌ ERROR: La compilación falló. Corrige los errores antes de desplegar."
  exit 1
fi

echo "✅ VERIFICACIÓN COMPLETA: Todo está listo para despliegue en Render"
echo ""
echo "ℹ️ PRÓXIMOS PASOS:"
echo "1. Commit de los cambios: git add . && git commit -m \"Fix: Render deployment issues\""
echo "2. Push al repositorio: git push origin master"
echo "3. Verificar el despliegue en el panel de Render"
