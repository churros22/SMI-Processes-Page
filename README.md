# Les Processus de SMI — Top Gloves Latex Industries

[![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)](https://github.com/)
[![Normes](https://img.shields.io/badge/SMI-ISO_9001_%7C_ISO_13485-003B7A.svg)](https://github.com/)

Application web interactive pour l'hébergement, la visualisation et la gestion de la cartographie des 14 processus du **Système de Management Intégré (SMI)**, en français (normes **ISO 9001** et **ISO 13485** - Dispositifs Médicaux).

![Logo Top Gloves Latex Industries](public/logo.png)

---

## 🔑 Codes d'Accès & Rôles


  - **Mode Consultation seule** : Consultation de la cartographie des 14 processus, filtres par catégorie, recherche et ouverture des fiches (HTML, Images HD >10 Mo, Word `.docx`) dans de nouveaux onglets.
  - **Mode Administration complète** : Édition interactive du schéma (déplacement des nœuds par glisser-déposer, création de nouvelles interactions), ajout/modification/suppression de processus, **téléversement et remplacement facile des fichiers (HTML, Images Haute Qualité jusqu'à 100 Mo, Word .docx)**, sauvegarde, import et export JSON.

---

## 📋 Les 14 Processus du SMI

L'application intègre la cartographie officielle des 14 processus SMI de l'entreprise :

### 1. Processus de Management (Pilotage)
- **P#1.1** : Stratégies & Revue de Direction (`p1.1-strategie.html`)
- **P#1.2** : Affaires Réglementaires & Surveillance Post-Commercialisation (`p1.2-affaires-reglementaires.html`)
- **P#1.3** : Management Qualité (`p1.3-management-qualite.html`)
- **P#1.3.1** : Maîtrise Documentation SMI (`p1.3.1-documentation-smi.html`)
- **P#1.4** : Assurance Qualité Technique (`p1.4-assurance-qualite-technique.html`)
- **P#9** : Maîtrise du Coût de la Non-Qualité (`p9-cout-non-qualite.html`)

### 2. Processus de Réalisation (Opérationnels)
- **P#2** : Identification des Besoins & Gestion des Retours Client (`p2-retours-client.html`)
- **P#3** : Maîtrise des Achats - Patrimoine (`p3-achats-patrimoine.html`)
- **P#3.1** : Vérification des Achats & Gestion du Patrimoine (`p3.1-verification-achats.html`)
- **P#5** : Maîtrise des Activités Opérationnelles (Fabrication) (`p5-activites-operationnelles.html`)
- **P#7** : Maîtrise Contrôle & Essais des Produits (`p7-controle-essais-produits.html`)

### 3. Processus Support (Soutien)
- **P#4** : Maîtrise & Gestion des Compétences (`p4-gestion-competences.html`)
- **P#6** : Maîtrise du Système d'Information (`p6-systeme-information.html`)
- **P#8** : Maîtrise Santé, Sécurité & Environnement (`p8-sante-securite-environnement.html`)

---

## 🎨 Support des Fichiers Volumineux & Formats

L'application accepte le téléversement et le remplacement de :
- 🌐 **Pages HTML** (`.html`, `.htm`)
- 🖼️ **Images Haute Qualité (&gt; 10 Mo jusqu'à 100 Mo)** (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`)
- 📄 **Documents Word & Baut** (`.doc`, `.docx`, `.pdf`)

---

## 🚀 Installation & Lancement

```bash
# Installation des dépendances
npm install

# Lancement en mode dev (sur http://localhost:3000)
npm run dev

# Lancement serveur Node Express (sur http://localhost:3001)
npm start
```

© 
