@echo off
echo ======================================================
echo     CORRECCION DE ERRORES TYPESCRIPT PARA RENDER
echo ======================================================
echo.

REM Verificar si estamos en la carpeta raiz del proyecto
if not exist "package.json" (
    echo ERROR: Este script debe ejecutarse desde la carpeta raiz del proyecto
    echo donde se encuentra el archivo package.json.
    exit /b 1
)

echo Aplicando correccion a interfaces de autenticacion...
echo.

REM Buscar la definicion de AuthenticatedRequest y modificarla
set "FOUND_FILE="
for /f "delims=" %%i in ('findstr /s /m "interface AuthenticatedRequest extends Request" src\*.ts') do (
    set "FOUND_FILE=%%i"
    echo Encontrado AuthenticatedRequest en: %%i
)

if not defined FOUND_FILE (
    echo No se encontro la definicion de AuthenticatedRequest.
    echo El error puede estar en otro lugar.
    exit /b 1
)

echo.
echo Actualizando la interfaz AuthenticatedRequest...

REM Crear un archivo temporal
type %FOUND_FILE% > temp.ts

REM Reemplazar la linea con la definicion de la interfaz
powershell -Command "(Get-Content temp.ts) -replace 'interface AuthenticatedRequest extends Request \{(\s+)user: User;(\s+)\}', 'interface AuthenticatedRequest extends Request {`n  user: User;`n  headers: {`n    authorization?: string;`n    [key: string]: any;`n  };`n}' | Set-Content temp.ts"

REM Copiar el archivo actualizado de vuelta
type temp.ts > %FOUND_FILE%

REM Eliminar el archivo temporal
del temp.ts

echo.
echo Ejecutando compilacion de prueba...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: La compilacion fallo. Por favor, revisa los errores.
    exit /b 1
)

echo.
echo ======================================================
echo CORRECCION COMPLETADA CON EXITO!
echo.
echo Para desplegar en Render:
echo 1. Haz commit de los cambios:
echo    git add .
echo    git commit -m "Fix: TypeScript compilation errors for Render"
echo 2. Sube los cambios al repositorio:
echo    git push
echo 3. Verifica el despliegue en el panel de Render
echo ======================================================
