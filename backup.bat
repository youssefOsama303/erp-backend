@echo off
REM ============================================================
REM  Nexus ERP — Database Backup Script (Windows)
REM  يعمل على Windows مع PostgreSQL مثبّت
REM  الاستخدام: double-click على backup.bat
REM ============================================================
setlocal EnableDelayedExpansion

REM ── الإعدادات — عدّلها حسب بيئتك ──
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=nexus_erp
set DB_USER=postgres
set BACKUP_DIR=%~dp0backups

REM ── إنشاء مجلد النسخ إن لم يكن موجوداً ──
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo [OK] Created backups directory: %BACKUP_DIR%
)

REM ── اسم الملف بالتاريخ والوقت ──
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set DT=%%a
set TIMESTAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%%DT:~10,2%%DT:~12,2%
set BACKUP_FILE=%BACKUP_DIR%\nexus_erp_%TIMESTAMP%.sql

echo.
echo ============================================================
echo   NEXUS ERP — Database Backup
echo ============================================================
echo   Database : %DB_NAME%
echo   Host     : %DB_HOST%:%DB_PORT%
echo   File     : %BACKUP_FILE%
echo   Time     : %TIMESTAMP%
echo ============================================================
echo.

REM ── تشغيل pg_dump ──
echo [..] Running pg_dump...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --no-password -f "%BACKUP_FILE%"

if %ERRORLEVEL% == 0 (
    echo.
    echo [OK] Backup completed successfully!
    echo [OK] File: %BACKUP_FILE%
    
    REM ── حذف النسخ الأقدم من 30 يوم ──
    echo [..] Cleaning backups older than 30 days...
    forfiles /p "%BACKUP_DIR%" /s /m *.sql /D -30 /C "cmd /c del @path" 2>nul
    echo [OK] Old backups cleaned.
) else (
    echo.
    echo [ERROR] Backup FAILED! Error code: %ERRORLEVEL%
    echo [INFO] Make sure:
    echo   1. PostgreSQL is running
    echo   2. pg_dump is in your PATH (C:\Program Files\PostgreSQL\XX\bin)
    echo   3. DB_USER and DB_NAME above are correct
)

echo.
echo Press any key to exit...
pause > nul
