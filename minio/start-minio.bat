@echo off
set MINIO_ROOT_USER=minioadmin
set MINIO_ROOT_PASSWORD=minioadmin
set MINIO_DATA_DIR=%~dp0data

if not exist "%MINIO_DATA_DIR%" mkdir "%MINIO_DATA_DIR%"

echo ========================================
echo MinIO Server Starting...
echo ========================================
echo Console URL: http://127.0.0.1:9001
echo API URL: http://127.0.0.1:9000
echo Username: minioadmin
echo Password: minioadmin
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

minio.exe server "%MINIO_DATA_DIR%" --console-address ":9001"
