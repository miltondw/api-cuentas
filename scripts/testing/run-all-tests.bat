@echo off
REM Script principal para ejecutar todas las verificaciones y pruebas (Windows)

echo === Ejecutando suite de pruebas para la API de autenticacion ===
echo Fecha: %DATE% %TIME%

REM Verificar que el servidor esté en ejecución
echo.
echo Verificando que el servidor este funcionando...
curl -s http://localhost:5051/health >nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] El servidor no esta respondiendo. Por favor, inicie el servidor antes de ejecutar las pruebas.
  exit /b 1
)
echo [OK] Servidor funcionando correctamente

REM 1. Verificar estructura de tablas
echo.
echo Ejecutando verificacion de estructura de tablas...
node scripts/verify-tables-structure.js
if %ERRORLEVEL% neq 0 (
  echo [ERROR] La verificacion de tablas fallo
  exit /b 1
)

REM 2. Ejecutar pruebas de API
echo.
echo Ejecutando pruebas de API...
node scripts/test-api.js
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Las pruebas de API fallaron
  exit /b 1
)

echo.
echo === Todas las pruebas completadas con exito ===
echo La API de autenticacion esta correctamente configurada y funcionando
exit /b 0
