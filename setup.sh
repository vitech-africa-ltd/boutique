#!/bin/bash
echo "--------------------------------------------------"
echo "   VI ERP Pro - Multi-Platform Setup Script       "
echo "--------------------------------------------------"

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo "ERREUR: Node.js n'est pas installé. Veuillez l'installer sur https://nodejs.org/"
    exit
fi

echo "[1/3] Installation des dépendances..."
npm install --no-audit --no-fund

echo "[2/3] Compilation des fichiers web..."
npm run build

echo "[3/3] Création de l'INSTALLATEUR PROFESSIONNEL..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Construction pour macOS (DMG)..."
    npm run electron:build -- --mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Construction pour Linux (AppImage/Deb)..."
    npm run electron:build -- --linux
else
    echo "Système d'exploitation non supporté pour le build automatique."
    npm run electron:build
fi

echo "--------------------------------------------------"
echo "Terminé ! L'installateur est dans : dist_electron"
echo "--------------------------------------------------"
