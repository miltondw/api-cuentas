#!/bin/bash

# Script para corregir errores de TypeScript y preparar para despliegue en Render
# Autor: Equipo Ingeocimyc
# Fecha: 12 de junio de 2025

echo "🔍 Buscando y corrigiendo errores de compilación TypeScript..."

# Directorio de archivos TypeScript
SRC_DIR="src"

# Verificar si el directorio existe
if [ ! -d "$SRC_DIR" ]; then
  echo "❌ Error: El directorio '$SRC_DIR' no existe"
  exit 1
fi

# Corregir problemas de tipos en AuthenticatedRequest
echo "🔧 Corrigiendo interfaces y tipos para AuthenticatedRequest..."

# Buscar todos los archivos que contengan AuthenticatedRequest
AUTH_FILES=$(grep -l "AuthenticatedRequest" --include="*.ts" -r $SRC_DIR)

# Para cada archivo encontrado
for file in $AUTH_FILES; do
  echo "📄 Procesando archivo: $file"
  
  # Verificar si el archivo contiene la definición de la interfaz
  if grep -q "interface AuthenticatedRequest extends Request" "$file"; then
    echo "  ✅ Encontrada definición de AuthenticatedRequest en $file"
    
    # Verificar si ya tiene la propiedad headers definida
    if ! grep -q "headers: {" "$file"; then
      echo "  🔄 Actualizando definición para incluir headers..."
      
      # Reemplazar la definición de la interfaz para incluir headers
      sed -i 's/interface AuthenticatedRequest extends Request {/interface AuthenticatedRequest extends Request {\n  headers: {\n    authorization?: string;\n    [key: string]: any;\n  };/g' "$file"
      
      echo "  ✅ Interfaz actualizada en $file"
    else
      echo "  ✓ La propiedad headers ya está definida en $file"
    fi
  fi

  # Verificar si hay advertencias por el uso de req.headers
  if grep -q "req\.headers" "$file"; then
    echo "  🔍 Verificando usos de req.headers en $file"
  fi
done

echo "🧹 Limpiando archivos de compilación anteriores..."
rm -rf dist

echo "🛠️ Ejecutando compilación de prueba..."
npm run build

# Verificar si la compilación tuvo éxito
if [ $? -eq 0 ]; then
  echo "✅ Compilación exitosa!"
else
  echo "❌ La compilación falló. Revise los errores de TypeScript."
  exit 1
fi

# Crear archivo de verificación para Render
echo "📝 Creando archivo de verificación para Render..."
echo "// Este archivo confirma que la compilación fue verificada" > src/render-verify.ts
echo "export const RENDER_DEPLOY_VERIFIED = true;" >> src/render-verify.ts
echo "export const RENDER_DEPLOY_DATE = '$(date)';" >> src/render-verify.ts

echo "✅ ¡Listo para desplegar en Render!"
echo "Ejecute 'git add . && git commit -m \"Fix: TypeScript compilation issues for Render deploy\" && git push' para subir los cambios"
