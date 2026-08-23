# 📋 Résumé du Projet : Cartographie des Processus SMI
## **Top Gloves Latex Industries — ISO 9001 • ISO 13485**

---

## 📄 1. Vue d'Ensemble du Projet
- **Titre Officiel** : *Les Processus de SMI — Top Gloves Latex Industries*
- **Normes Qualité & Réglementaires** : **ISO 9001 • ISO 13485** (Dispositifs Médicaux / Gants en Latex)
- **Langue** : 100% Français
- **Description** : Application web moderne, réactive et hautement performante conçue pour héberger, visualiser et administrer la cartographie des interactions entre les processus du Système de Management Intégré (SMI). Elle permet la consultation fluide des fiches processus et documents rattachés (HTML, Word, Images HD) sur ordinateur, tablette et smartphone.

---

## 🔑 2. Gestion des Accès & Sécurité

L'application repose sur deux niveaux d'accès sécurisés par mot de passe :

| Rôle | Mot de passe | Droits & Fonctionnalités |
| :--- | :---: | :--- |
| **Utilisateur (Consultation)** | `tgent3` | • Consultation de la cartographie (Carte 2D et Vue Liste)<br>• Filtrage par catégories (Management, Réalisation, Support) et recherche textuelle<br>• Ouverture des documents et sous-processus dans un nouvel onglet<br>• Zoom (jusqu'à 500%), impression et téléchargement des documents originaux |
| **Administrateur (Gestion)** | `admin1104` | • Édition interactive de la cartographie (déplacement des cartes par clic-glisser)<br>• Ajout, modification et suppression des processus et sous-processus<br>• Téléversement et remplacement en direct des fichiers (HTML, Word `.docx`, Images HD >10 Mo)<br>• Création, modification et suppression des flèches d'interaction et étiquettes<br>• Sauvegarde globale, réinitialisation aux valeurs par défaut, export/import JSON |

---

## 📐 3. Cartographie & Hiérarchie des Processus

L'application structure les 14 processus et sous-processus officiels de Top Gloves en **3 Zones (Swimlanes)** claires et aérées :

1. **ZONE 1 : PROCESSUS DE MANAGEMENT (PILOTAGE)**
   - `P#1.1` : Stratégies & Revue de Direction
   - `P#1.2` : Affaires Réglementaires & Surveillance Post-Commercialisation (ISO 13485)
   - `P#1.3` : Management Qualité
     - ↳ **Sous-Processus** : `P#1.3.1` — Maîtrise Documentation SMI
   - `P#1.4` : Assurance Qualité Technique
   - `P#9` : Maîtrise Coût de la Non-Qualité

2. **ZONE 2 : PROCESSUS DE RÉALISATION (OPÉRATIONNELS)**
   - `P#2` : Besoins & Retours Clients
   - `P#3` : Maîtrise des Achats - Patrimoine
     - ↳ **Sous-Processus** : `P#3.1` — Vérification Achats & Patrimoine
   - `P#5` : Activités Opérationnelles (Fabrication gants)
   - `P#7` : Contrôle & Essais Produits

3. **ZONE 3 : PROCESSUS SUPPORT (SOUTIEN)**
   - `P#4` : Gestion des Compétences
   - `P#6` : Système d'Information (IT / ERP)
   - `P#8` : Santé, Sécurité & Environnement (HSE)

---

## 🛠️ 4. Visionneuses Intégrées & Fonctionnalités Clés

### 1. Visionneuse Microsoft Word (`.docx`) — Style Logiciel
- **Fidélité 1-à-1** : Utilisation de la bibliothèque `docx-preview` pour restituer l'intégralité des **en-têtes, pieds de page, marges, numérotation des pages, tableaux et images originaux**.
- **Zoom Ultra Précis (30% à 500%)** : Curseur de zoom (Slider) avec boutons pas-à-pas et raccourci `Ctrl + Molette`.
- **Navigation Fluidifiée** : Mode Pan & Drag pour faire glisser le document à la souris lors d'un zoom important.
- **Bouton d'Impression** : Permet l'impression directe du document depuis le navigateur.

### 2. Visionneuse d'Images Haute Définition (Fichiers > 10 Mo)
- **Mode Ajuster Écran (`Fit Screen`)** : Adapte automatiquement la taille au chargement pour éviter tout sur-zoom.
- **Zoom Dynamique (20% à 500%)** : Slider interactif et déplacement par glisser-déplacer.

### 3. Visionneuse Fiches HTML
- Rendu iframe propre et réactif avec intégration CSS isolée.

### 4. Ouverture en Nouvel Onglet (`window.open`)
- Chaque document s'ouvre dans une fenêtre/onglet dédié comprenant :
  - L'en-tête compact Top Gloves Latex Industries.
  - La **barre d'onglets de Sous-Processus** permettant de basculer instantanément entre le document du processus parent et ses sous-processus sans fermer l'onglet.
  - Les boutons d'impression, de téléchargement et de fermeture.

---

### 📱 5. Ergonomie Mobile & Responsive Design
- **Ajustement Automatique du Canvas** : Échelle réglée à `55%` par défaut sur mobile pour afficher l'ensemble de la cartographie sans défilement excessif.
- **En-tête Compact Mobile** : Réduction de la hauteur du bandeau supérieur pour réserver 90%+ de l'écran au contenu.
- **Mode Liste en Cartes Mobiles** : Conversion automatique du tableau en cartes tactiles lisibles et faciles à utiliser au pouce sur smartphone.

---

## 💾 6. Stockage, Hébergement & Déploiement

- **Hébergement Gratuit sur GitHub Pages** :
  - Découpage manuel des modules (`manualChunks` dans `vite.config.js`) garantissant un bundle initial ultraléger (**< 15 KB gzippé**).
  - Chemins relatifs configurés (`base: './'`).
  - Workflow d'intégration continue GitHub Actions pré-configuré dans `.github/workflows/deploy.yml`.

- **Double Mode de Stockage des Fichiers** :
  1. **Mode Serveur (Node.js / Express)** : Stockage physique des fichiers dans `public/processes/` et des configurations dans `data/config.json`.
  2. **Mode Statique (Client-Side)** : Stockage persistant des fichiers dans **IndexedDB** (`process_files`) et du schéma dans **LocalStorage** (`SMI_TOP_GLOVES_CONFIG_V1`).

---

## 📁 7. Structure du Dépôt

```
SMI Processes Page/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automation pour GitHub Pages
├── data/
│   └── config.json             # Configuration backend des processus
├── public/
│   ├── logo.png                # Logo officiel Top Gloves
│   └── processes/              # Fichiers HTML officiels (P#1.1 à P#9)
├── src/
│   ├── assets/                 # Ressources graphiques
│   ├── components/
│   │   ├── AdminToolbar.jsx    # Barre d'outils flottante admin
│   │   ├── AuthModal.jsx       # Modal de mots de passe (tgent3 / admin1104)
│   │   ├── DocumentViewerModal.jsx # Visionneuse Word (500% zoom) & Images HD
│   │   ├── EditProcessModal.jsx# Modal d'édition des sous-processus & fichiers
│   │   ├── Header.jsx          # Barre d'en-tête et filtres
│   │   ├── ProcessMapCanvas.jsx# Canvas 2D interactif
│   │   └── ProcessListView.jsx # Vue liste / tableau inventaire
│   ├── data/
│   │   └── initialProcesses.js # 14 processus & sous-processus initiaux
│   ├── utils/
│   │   ├── openProcessNewTab.js# Générateur de la visionneuse nouvel onglet
│   │   └── storage.js          # Synchronisation IndexedDB / LocalStorage / Server
│   ├── App.jsx                 # Composant principal
│   └── App.css                 # Design System & Responsive CSS
├── server.js                   # Serveur optionnel Express / Node.js
├── vite.config.js              # Configuration du bundler Vite
└── package.json                # Dépendances du projet
```

---

### 🌐 Liens d'accès au Serveur Local :
- **Local (PC)** : [http://localhost:3000/](http://localhost:3000/)
- **Réseau Local (Mobile / Tablette)** : `http://192.168.1.132:3000/` ou `http://192.168.0.116:3000/`
