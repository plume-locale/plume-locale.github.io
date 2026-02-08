# Documentation de Plume

Bienvenue dans la documentation du projet **Plume**. Ce dossier contient toutes les informations nécessaires pour utiliser et développer l'application.

## Structure de la Documentation

- **[Guide Utilisateur](USER_GUIDE.md)** : Manuel d'utilisation des fonctionnalités principales (Timeline, Enquête, Personnages, etc.).
- **[Guide Développeur](DEVELOPER.md)** : Documentation technique, architecture du code, scripts de build et déploiement.

## Aperçu du Projet

Plume est une application web d'aide à l'écriture, offrant des outils pour structurer des récits, gérer des personnages et visualiser des intrigues complexes.

### Commandes Rapides

- **Build Version Unique (HTML unique)** :
  ```bash
  python build.light.py
  ```
  Génère un fichier unique `plume-light-YYYY.MM.DD.HH.MM.html` dans le dossier `build/`.

- **Déploiement Live (Fichiers séparés)** :
  ```bash
  python deploy-to-live.py
  ```
  Déploie l'application dans le dossier `live/` avec une structure de fichiers éclatée (idéal pour le débogage).
