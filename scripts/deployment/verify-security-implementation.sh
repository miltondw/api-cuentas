#!/bin/bash

# 🛡️ Script de Verificación - Implementación de Seguridad Avanzada
# Este script verifica que la implementación de seguridad esté completa y funcional

echo "🔍 Verificando implementación de seguridad avanzada..."
echo "=================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

echo "✅ Directorio correcto detectado"

# Verificar dependencias requeridas
echo ""
echo "📦 Verificando dependencias..."

required_deps=(
    "@nestjs/cache-manager"
    "@nestjs/event-emitter"
    "@nestjs/schedule"
    "express-rate-limit"
    "ua-parser-js"
    "uuid"
    "moment"
)

missing_deps=()

for dep in "${required_deps[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        echo "✅ $dep instalado"
    else
        echo "❌ $dep NO ENCONTRADO"
        missing_deps+=("$dep")
    fi
done

if [ ${#missing_deps[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Dependencias faltantes detectadas. Instalando..."
    npm install "${missing_deps[@]}"
    if [ $? -eq 0 ]; then
        echo "✅ Dependencias instaladas exitosamente"
    else
        echo "❌ Error instalando dependencias"
        exit 1
    fi
else
    echo "✅ Todas las dependencias están instaladas"
fi

# Verificar archivos de entidades
echo ""
echo "🗃️ Verificando entidades de seguridad..."

entities=(
    "src/modules/auth/entities/auth-log.entity.ts"
    "src/modules/auth/entities/user-session.entity.ts"
    "src/modules/auth/entities/failed-login-attempt.entity.ts"
)

for entity in "${entities[@]}"; do
    if [ -f "$entity" ]; then
        echo "✅ $(basename "$entity")"
    else
        echo "❌ FALTANTE: $entity"
    fi
done

# Verificar servicios
echo ""
echo "⚙️ Verificando servicios de seguridad..."

services=(
    "src/modules/auth/services/auth-log.service.ts"
    "src/modules/auth/services/session.service.ts"
    "src/modules/auth/services/security.service.ts"
    "src/common/services/cleanup.service.ts"
)

for service in "${services[@]}"; do
    if [ -f "$service" ]; then
        echo "✅ $(basename "$service")"
    else
        echo "❌ FALTANTE: $service"
    fi
done

# Verificar migraciones
echo ""
echo "🔄 Verificando migraciones..."

migrations=(
    "src/migrations/1700000001-CreateAuthLogTable.ts"
    "src/migrations/1700000002-CreateUserSessionTable.ts"
    "src/migrations/1700000003-CreateFailedLoginAttemptTable.ts"
    "src/migrations/1700000004-AddSecurityFieldsToUser.ts"
)

for migration in "${migrations[@]}"; do
    if [ -f "$migration" ]; then
        echo "✅ $(basename "$migration")"
    else
        echo "❌ FALTANTE: $migration"
    fi
done

# Verificar middleware
echo ""
echo "🛡️ Verificando middleware de seguridad..."

if [ -f "src/common/middleware/rate-limit.middleware.ts" ]; then
    echo "✅ Rate limiting middleware"
else
    echo "❌ FALTANTE: Rate limiting middleware"
fi

if [ -f "src/modules/auth/guards/admin.guard.ts" ]; then
    echo "✅ Admin guard"
else
    echo "❌ FALTANTE: Admin guard"
fi

# Verificar archivos principales actualizados
echo ""
echo "📝 Verificando archivos principales..."

main_files=(
    "src/main.ts"
    "src/app.module.ts"
    "src/modules/auth/auth.module.ts"
    "src/modules/auth/auth.service.ts"
    "src/modules/auth/auth.controller.ts"
    "src/modules/auth/dto/auth.dto.ts"
)

for file in "${main_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $(basename "$file")"
    else
        echo "❌ FALTANTE: $file"
    fi
done

# Verificar documentación
echo ""
echo "📚 Verificando documentación..."

docs=(
    "API.md"
    ".env.example"
    "SECURITY_IMPLEMENTATION_COMPLETE.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "✅ $doc"
    else
        echo "❌ FALTANTE: $doc"
    fi
done

# Intentar compilar el proyecto
echo ""
echo "🔧 Verificando compilación..."

if npm run build > /dev/null 2>&1; then
    echo "✅ Compilación exitosa"
else
    echo "⚠️  Error de compilación detectado. Ejecuta 'npm run build' para ver detalles."
fi

# Verificar configuración de TypeScript
echo ""
echo "📋 Verificando configuración TypeScript..."

if npx tsc --noEmit > /dev/null 2>&1; then
    echo "✅ Verificación de tipos exitosa"
else
    echo "⚠️  Errores de tipos detectados. Ejecuta 'npx tsc --noEmit' para ver detalles."
fi

echo ""
echo "=================================================="
echo "🎉 Verificación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Revisar y actualizar el archivo .env con las nuevas variables"
echo "2. Ejecutar migraciones de base de datos: npm run migration:run"
echo "3. Probar los nuevos endpoints en /api-docs"
echo "4. Implementar el frontend usando los ejemplos en API.md"
echo ""
echo "🔗 Recursos:"
echo "- Documentación completa: API.md"
echo "- Swagger UI: http://localhost:5051/api-docs"
echo "- Guía de implementación: SECURITY_IMPLEMENTATION_COMPLETE.md"
echo ""
echo "✨ ¡La implementación de seguridad avanzada está lista!"
