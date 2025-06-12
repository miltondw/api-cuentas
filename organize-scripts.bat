@echo off
echo Organizando archivos de scripts...

REM Archivos de base de datos
echo Moviendo archivos de base de datos...
move add-security-fields-to-usuarios.sql scripts\database\
move check-database-structure.js scripts\database\
move check-table-structures.js scripts\database\
move connect-mysql.sh scripts\database\
move mysql-dashboard.js scripts\database\
move mysql-query.js scripts\database\
move mysql-quick-check.js scripts\database\
move update-proyectos-table.sql scripts\database\
move update-usuarios-table.sql scripts\database\
move verify-table-names.js scripts\database\
move verify-tables-structure.js scripts\database\

REM Archivos de seguridad
echo Moviendo archivos de seguridad...
move create-auth-logs-table.js scripts\security\
move create-security-tables.sql scripts\security\
move fix-all-security-tables.js scripts\security\
move fix-duplicate-tables.js scripts\security\
move fix-missing-tables.js scripts\security\
move fix-missing-tables.sql scripts\security\
move fix-security-tables-correct.js scripts\security\
move fix-security-tables-mysql.js scripts\security\
move fix-user-sessions-safe.js scripts\security\
move fix-user-sessions-table.js scripts\security\
move migrate-database-security.sql scripts\security\
move update-migration-files.js scripts\security\
move verify-auth-tables.js scripts\security\
move verify-database-security.sql scripts\security\
move verify-security-implementation.sh scripts\security\

REM Archivos de pruebas
echo Moviendo archivos de pruebas...
move run-all-auth-tests.bat scripts\testing\
move run-all-tests.bat scripts\testing\
move run-all-tests.sh scripts\testing\
move test-api.js scripts\testing\
move test-api.sh scripts\testing\
move test-auth-endpoints.bat scripts\testing\
move test-auth-endpoints.js scripts\testing\
move test-auth-endpoints.sh scripts\testing\

REM Archivos de despliegue
echo Moviendo archivos de despliegue...
move build-prod.sh scripts\deployment\
move check-cors-config.sh scripts\deployment\
move debug-build.sh scripts\deployment\
move install-mysql-client.sh scripts\deployment\
move pre-deployment-check.sh scripts\deployment\
move pre-deployment-verification.sh scripts\deployment\
move render-build.sh scripts\deployment\
move render-deploy-verify.sh scripts\deployment\
move verify-optimization.sh scripts\deployment\

REM Archivos de utilidades
echo Moviendo archivos de utilidades...
move update-sql-scripts.js scripts\utils\

REM Archivos temporales o informes (opcional, podrían eliminarse)
echo Moviendo archivos temporales...
IF EXIST session-data.json move session-data.json scripts\testing\
IF EXIST table-check-report.json move table-check-report.json scripts\testing\

echo Organización de archivos completada.
