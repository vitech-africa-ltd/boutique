# Manuel d'Installation Professionnel - V&I ERP Pro (Africa Edition)

Ce document décrit la procédure complète pour installer et tester le système ERP sur une machine locale, permettant un fonctionnement **100% Hors-Ligne (Offline)**.

## 1. Concepts Clés du Système
*   **Offline-First** : La base de données est stockée localement dans le navigateur (IndexedDB via Dexie.js). Aucune connexion internet n'est requise après le chargement initial.
*   **PWA (Progressive Web App)** : Le système peut être installé comme une application Windows/Mac/Linux native.
*   **Sécurité Anti-Fraude** : Journal d'audit avec hachage SHA-256 pour détecter toute altération manuelle des données.

## 2. Prérequis Systèmes
*   **Node.js (LTS)** : Version 18 ou supérieure.
*   **Navigateur** : Google Chrome, Microsoft Edge ou tout navigateur basé sur Chromium (pour le support PWA complet).

## 3. Procédure d'Installation (Machine Locale)

### Méthode Professionnelle (Installateur Desktop Multi-Plateforme)
Cette méthode crée un véritable fichier d'installation (Windows .exe, Mac .dmg, Linux .AppImage) qui installe l'ERP avec votre logo personnalisé.

1.  **Icône Perso** : Placez votre logo dans `public/app-icon.png`. (Conseil : format Carré 512x512).
2.  **Lancement du Build** :
    *   **Windows** : Double-cliquez sur `setup.bat`.
    *   **Mac / Linux** : Ouvrez un terminal et lancez `bash setup.sh`.
3.  **Résultat** : L'installateur final sera dans le dossier `dist_electron`.
4.  **Installation** : Exécutez le fichier généré pour installer l'application définitivement.

### Méthode Web (Serveur Local)
Pour un usage rapide sans installateur :
1.  Ouvrez un terminal.
2.  Exécutez `npm run build`.
3.  Lancez le serveur : `npx serve -s dist`.

## 4. Mode Offline (Hors-Ligne)
L'application est configurée pour fonctionner sans internet dès son premier lancement.
*   **Base de Données** : Les données sont stockées dans `AfricanERP_ProDB` (local).
*   **Mises à jour** : Si vous modifiez le code, vous devez relancer `npm run electron:build` pour régénérer l'installateur.

## 5. Identifiants par Défaut (Démonstration)
*   **Admin** : `admin` / `admin`
*   **Gestionnaire** : `manager` / `manager` (à créer dans les paramètres)

## 6. Maintenance et Sécurité
*   **Sauvegarde** : Les données sont stockées dans `IndexedDB`. Pour une sauvegarde manuelle, utilisez l'option d'exportation PDF/CSV disponible dans chaque module.
*   **Journal d'Audit** : Consultez l'onglet "Audit" pour vérifier l'intégrité des transactions. La signature numérique (Hash) garantit qu'aucune vente n'a été supprimée ou modifiée frauduleusement.

---
*Réalisé par vab&idriss tech corp - 2026*
