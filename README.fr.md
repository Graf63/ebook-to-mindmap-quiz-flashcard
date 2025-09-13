# eBook en Outils d'Étude

Un outil intelligent d'analyse de livres électroniques basé sur l'IA, qui prend en charge la conversion de livres électroniques au format EPUB et PDF en cartes mentales structurées, quiz et flashcards.

## ✨ Fonctionnalités

### 📚 Prise en charge de plusieurs formats
- **Fichiers EPUB** : Prise en charge complète de l'analyse et du traitement des livres électroniques au format EPUB.
- **Fichiers PDF** : Analyse intelligente des documents PDF, prenant en charge l'extraction de chapitres basée sur la table des matières et la détection intelligente.

### 🤖 Traitement de contenu piloté par l'IA
- **Plusieurs services d'IA** : Prend en charge les modèles Google Gemini et OpenAI GPT.
- **Trois modes de traitement** :
  - 📝 **Mode Carte Mentale** : Génère une carte mentale pour chaque chapitre ou pour l'ensemble du livre.
  - 🧠 **Mode Quiz** : Crée des quiz à choix multiples pour chaque chapitre avec les réponses et l'emplacement des sources.
  - 🌐 **Mode Flashcard** : Génère des flashcards avec des questions/termes et des réponses, incluant l'emplacement des sources.

### 🎯 Traitement intelligent des chapitres
- **Détection intelligente des chapitres** : Identifie et extrait automatiquement la structure des chapitres du livre.
- **Filtrage des chapitres** : Prend en charge le saut de contenu non essentiel tel que les avant-propos, la table des matières et les remerciements.
- **Sélection flexible** : Les utilisateurs peuvent choisir librement les chapitres à traiter.
- **Prise en charge des sous-chapitres** : Profondeur configurable pour l'extraction des sous-chapitres.

### 💾 Mécanisme de mise en cache efficace
- **Mise en cache intelligente** : Met automatiquement en cache les résultats du traitement par l'IA pour éviter les calculs redondants.
- **Gestion du cache** : Prend en charge la suppression du cache par mode pour économiser de l'espace de stockage.
- **Visualisation hors ligne** : Le contenu traité peut être consulté hors ligne.

### 🎨 Interface moderne
- **Conception réactive** : S'adapte à différentes tailles d'écran.
- **Progression en temps réel** : Traitement visualisé avec affichage en temps réel de l'étape en cours.
- **Sorties interactives** :
    - **Cartes mentales** : Prise en charge du zoom, du glisser-déposer et de l'expansion/réduction des nœuds.
    - **Quiz** : Questions et réponses interactives.
    - **Flashcards** : Cartes retournables pour un rappel actif.
- **Aperçu du contenu** : Prise en charge de la visualisation du contenu original du chapitre.
- **Téléchargements polyvalents** : Exportez les cartes mentales sous forme d'images, et les quiz/flashcards en HTML interactif, PDF imprimable ou données JSON/CSV.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- pnpm (recommandé) ou npm

### Installation
```bash
# Cloner le projet
git clone <url-du-depot>
cd ebook-to-study-tools

# Installer les dépendances
pnpm install
# ou
npm install
```
Démarrage du serveur de développement
```bash

pnpm dev
# ou
npm run dev
```
Accédez à http://localhost:5173 pour commencer à utiliser l'application.

📖 Guide de l'utilisateur
1. Configurer le service d'IA
Lors de la première utilisation, vous devez configurer le service d'IA :

Cliquez sur le bouton "Configuration" en haut à droite.

Choisissez un fournisseur de services d'IA :

Google Gemini (recommandé) : Nécessite une clé API Gemini.

OpenAI GPT : Nécessite une clé API OpenAI et une URL d'API.

Saisissez la clé API correspondante.

Sélectionnez un modèle (facultatif, le modèle par défaut est suffisant).

2. Télécharger un fichier eBook
Cliquez sur le bouton "Sélectionner un fichier EPUB ou PDF".

Choisissez le fichier de livre électronique à traiter.

Formats pris en charge : .epub, .pdf.

3. Configurer les options de traitement
Définissez les paramètres de traitement dans la boîte de dialogue de configuration :

Mode de traitement
Mode Carte Mentale : Idéal pour les résumés visuels et la structure.

Mode Quiz : Idéal pour l'auto-évaluation et la vérification de la compréhension.

Mode Flashcard : Parfait pour mémoriser les termes et concepts clés.

4. Extraire les chapitres
Cliquez sur le bouton "Extraire les chapitres".

Le système analysera automatiquement le fichier et extraira la structure des chapitres.

Une fois l'extraction terminée, la liste des chapitres s'affichera.

Vous pouvez sélectionner les chapitres que vous souhaitez traiter (tous sont sélectionnés par défaut).

5. Démarrer le traitement
Confirmez votre sélection de chapitres.

Cliquez sur le bouton "Démarrer le traitement".

Le système affichera la progression du traitement et l'étape en cours.

Les résultats s'afficheront à la fin du traitement.

6. Afficher et télécharger les résultats
En fonction du mode de traitement choisi, vous pouvez afficher différents types de résultats et les télécharger dans divers formats, y compris en HTML interactif et en PDF imprimable pour les quiz et les flashcards.

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
