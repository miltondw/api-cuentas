@echo off
echo ===========================================
echo        PRUEBA DE AUTENTICACION API
echo ===========================================

REM Verificar que Node.js esté instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js no esta instalado
    exit /b 1
)

REM Verificar e instalar dependencias si es necesario
if not exist "node_modules\axios" (
    echo Instalando dependencias...
    call npm install axios dotenv --save-dev
    if %ERRORLEVEL% neq 0 (
        echo Error al instalar dependencias
        exit /b 1
    )
)

REM Ejecutar el script de prueba
echo.
echo Ejecutando prueba de endpoints de autenticacion...
echo.
call node scripts/test-auth-endpoints.js
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Hubo problemas durante la prueba de endpoints
) else (
    echo.
    echo ✅ La prueba de endpoints se completo correctamente
)

echo.
echo ===========================================
echo         ¡Pruebas completadas!
echo ===========================================
