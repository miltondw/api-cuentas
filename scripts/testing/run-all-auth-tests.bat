@echo off
echo =========================================================
echo        VERIFICACION COMPLETA DE AUTENTICACION
echo =========================================================
echo Este script ejecutara:
echo 1. Verificacion de la estructura de tablas de la base de datos
echo 2. Pruebas de los endpoints de autenticacion
echo.

REM Verificar que Node.js esté instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js no esta instalado
    exit /b 1
)

REM Verificar e instalar dependencias si es necesario
echo Verificando dependencias...
if not exist "node_modules\mysql2" (
    echo Instalando mysql2...
    call npm install mysql2 --save-dev
    if %ERRORLEVEL% neq 0 (
        echo Error al instalar mysql2
        exit /b 1
    )
)

if not exist "node_modules\axios" (
    echo Instalando axios...
    call npm install axios --save-dev
    if %ERRORLEVEL% neq 0 (
        echo Error al instalar axios
        exit /b 1
    )
)

if not exist "node_modules\dotenv" (
    echo Instalando dotenv...
    call npm install dotenv --save-dev
    if %ERRORLEVEL% neq 0 (
        echo Error al instalar dotenv
        exit /b 1
    )
)

echo.
echo Dependencias verificadas.
echo.
echo ---------------------------------------------------------
echo PASO 1: Verificando estructura de tablas de autenticacion
echo ---------------------------------------------------------
echo.

call node scripts/verify-auth-tables.js

echo.
echo ---------------------------------------------------------
echo PASO 2: Ejecutando pruebas de endpoints de autenticacion
echo ---------------------------------------------------------
echo.

call node scripts/test-auth-endpoints.js

echo.
echo =========================================================
echo              VERIFICACION COMPLETADA
echo =========================================================
echo.
echo Para mas detalles, revise los archivos de informes generados:
echo - table-check-report.json
echo - session-data.json
