@echo off
echo [INICIANDO O SISTEMA DE TICKETS]
echo.

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo [INSTALANDO DEPENDENCIAS...]
    npm install
    echo.
)

REM Verificar se arquivo .env existe
if not exist ".env" (
    echo [AVISO] Arquivo .env nao encontrado!
    echo Crie um arquivo .env com seu token do bot
    echo Exemplo:
    echo BOT_TOKEN=seu_token_aqui
    pause
    exit /b 1
)

echo [INICIANDO O BOT...]
echo.

:main
npm start
echo.
echo [REINICIANDO O BOT EM 5 SEGUNDOS...]
timeout /t 5 /nobreak >nul
goto main