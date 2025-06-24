@echo off
echo Starting development environment...

REM Kill any existing processes
taskkill /F /IM "node.exe" 2>NUL

REM Start the server in development mode
start "Server" cmd /k "set NODE_ENV=development && npx nodemon --exec ts-node server/index.ts"

REM Wait briefly
timeout /t 2 /nobreak >nul

REM Start the client
cd client && start "Client" cmd /k "npx vite --host 0.0.0.0 --port 3001 --clearScreen false --force"

echo Development servers started. Check the new terminal windows for output.