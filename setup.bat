@echo off
title VI ERP Pro - Installer Build
echo ==================================================
echo    VI ERP Pro - Africa Edition - Setup Script    
echo ==================================================

:: Fermer les processus qui pourraient verrouiller les fichiers
taskkill /f /im node.exe >nul 2>nul

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installe. Veuillez l'installer sur https://nodejs.org/
    pause
    exit
)

echo [1/4] Nettoyage et Installation...
if exist node_modules (
    echo Le dossier node_modules existe, passage direct a l'installation...
)
call npm install --no-audit --no-fund

echo [2/4] Compilation des fichiers web...
call npm run build

echo [3/4] Creation de l'INSTALLATEUR PROFESSIONNEL (.exe)...
echo Note: Si une erreur d'icone apparait, assurez-vous que public/app-icon.png est un carre parfait (512x512).
call npm run electron:build

echo [4/4] Finalisation...
echo L'installateur est disponible dans le dossier : dist_electron
echo Fichier genere : VI ERP Pro Setup.exe
pause
