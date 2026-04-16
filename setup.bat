@echo off
chcp 65001 > nul
title Nexus ERP — Setup Wizard

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║          NEXUS ERP — Automated Setup Script          ║
echo ║           نظام Nexus ERP — معالج التنصيب            ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: ── Step 1: Check Node.js ────────────────────────────────────────────────────
echo [1/6] Checking Node.js...
node --version > nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found! Please install it from: https://nodejs.org
    echo    ثم اعد تشغيل هذا السكريبت
    pause
    exit /b 1
)
FOR /F "tokens=*" %%i IN ('node --version') DO echo ✅ Node.js %%i found

:: ── Step 2: Check PostgreSQL ─────────────────────────────────────────────────
echo.
echo [2/6] Checking PostgreSQL...
psql --version > nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ⚠️  psql not found in PATH — make sure PostgreSQL is installed and in PATH
    echo    المشروع يحتاج PostgreSQL — تأكد من تنصيبه
    echo    Download: https://www.postgresql.org/download/windows/
    echo.
    choice /C YN /M "هل تريد الاستمرار رغم ذلك؟ / Continue anyway?"
    IF ERRORLEVEL 2 exit /b 1
) ELSE (
    FOR /F "tokens=*" %%i IN ('psql --version') DO echo ✅ %%i found
)

:: ── Step 3: Check .env file ──────────────────────────────────────────────────
echo.
echo [3/6] Checking environment configuration (.env)...
IF NOT EXIST .env (
    IF EXIST .env.example (
        copy .env.example .env > nul
        echo ⚠️  Created .env from .env.example — PLEASE EDIT IT with your DB credentials!
        echo    يرجى تعديل ملف .env وإضافة بيانات قاعدة البيانات الخاصة بك
        echo.
        echo    Open .env and set:
        echo      DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/nexus_erp
        echo      JWT_SECRET=your-very-long-secret-key-here
        echo.
        notepad .env
        echo    Press any key after saving .env...
        pause > nul
    ) ELSE (
        echo ❌ No .env file found and no .env.example to copy from!
        echo    Create a .env file manually with DATABASE_URL and JWT_SECRET
        pause
        exit /b 1
    )
) ELSE (
    echo ✅ .env file found
)

:: ── Step 4: npm install ──────────────────────────────────────────────────────
echo.
echo [4/6] Installing Node.js packages (npm install)...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ npm install failed! Check your internet connection.
    pause
    exit /b 1
)
echo ✅ Packages installed successfully

:: ── Step 5: Database migration ──────────────────────────────────────────────
echo.
echo [5/6] Running database migrations...
node db\migrate.js
IF %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Migration had issues — check DATABASE_URL in .env
    echo    Check that PostgreSQL is running and the database exists
) ELSE (
    echo ✅ Database schema ready
)

:: ── Step 6: Seed demo data ───────────────────────────────────────────────────
echo.
echo [6/6] Seeding demo data...
node seed-db.js
IF %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Seeding had issues — tables may already have data (OK to ignore)
) ELSE (
    echo ✅ Demo data loaded
)

:: ── Launch ────────────────────────────────────────────────────────────────────
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║                  ✅ SETUP COMPLETE!                  ║
echo ╠══════════════════════════════════════════════════════╣
echo ║  🌐 URL    : http://localhost:5000/admin/login.html  ║
echo ║  🏢 Company: nexus-demo                              ║
echo ║  👤 Admin  : admin@nexus.com / admin123              ║
echo ║  👁 Viewer : viewer@nexus.com / view123              ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo Starting server in 3 seconds...
timeout /t 3 /nobreak > nul

:: Open browser
start "" "http://localhost:5000/admin/login.html"

:: Start server
echo.
echo 🚀 Server starting... Press Ctrl+C to stop.
echo.
npm run dev
