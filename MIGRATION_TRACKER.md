# 🚀 Suivi de Migration - Halloothween Project

**Date de début :** 25 janvier 2026  
**Version actuelle :** 1.0.0 (CommonJS + Express 4)  
**Version cible :** 2.0.0 (ES Modules + Express 5 + Sharp)  
**Durée estimée :** 5-6 heures

---

## 📊 État Global de la Migration

| Phase | Statut | Durée | Début | Fin |
|-------|--------|-------|-------|-----|
| Phase 1 : Préparation | ✅ Terminé | 15 min | 25 jan 2026 | 25 jan 2026 |
| Phase 2 : ES Modules | ✅ Terminé | 2h | 25 jan 2026 | 25 jan 2026 |
| Phase 3 : Express 5 | ⬜ À faire | 1h30 | - | - |
| Phase 4 : Sharp | ⬜ À faire | 1h | - | - |
| Phase 5 : Dépendances | ⬜ À faire | 30 min | - | - |
| Phase 6 : Tests | ⬜ À faire | 1h | - | - |
| Phase 7 : Documentation | ⬜ À faire | 30 min | - | - |

**Légende :** ⬜ À faire | 🟦 En cours | ✅ Terminé | ❌ Échec | ⏸️ En pause

---

## 📝 PHASE 1 : Préparation (15 minutes)

**Statut :** ✅ Terminé  
**Début :** 25 janvier 2026  
**Fin :** 25 janvier 2026

### Checklist

- [x] **1.1** Créer branche `migration/modern-stack`
  ```bash
  git checkout -b migration/modern-stack
  ```
  
- [x] **1.2** Créer commit snapshot
  ```bash
  git add .
  git commit -m "chore: snapshot before migration to ES modules + Express 5 + Sharp"
  ```
  
- [x] **1.3** Backup package.json
  ```bash
  cp package.json package.json.backup
  cp PhotoboothStreamer/package.json PhotoboothStreamer/package.json.backup
  ```

- [x] **1.4** Documenter versions actuelles
  - Node.js : v25.3.0
  - Express : 4.16.4
  - EJS : 0.8.8
  - Socket.IO : 4.7.2
  - ImageMagick : 0.1.3

### Notes de Phase 1

```
✅ Préparation complète
- Branch créée: migration/modern-stack
- Snapshot commit: 7f1d428
- Backups créés avec succès
```

### Checkpoint 1

- [x] Branche créée et commit initial fait
- [x] Backups créés
- [x] Prêt à continuer vers Phase 2

---

## 🔄 PHASE 2 : Migration ES Modules (2 heures)

**Statut :** ✅ Terminé  
**Début :** 25 janvier 2026  
**Fin :** 25 janvier 2026

### 2.1 Modification package.json

- [x] **2.1.1** Ajouter `"type": "module"` au package.json principal
- [x] **2.1.2** Ajouter `"type": "module"` au PhotoboothStreamer/package.json
- [x] **2.1.3** Ajouter engines Node.js >= 18
- [x] **2.1.4** Commit : `git commit -m "chore: enable ES modules in package.json"` (ed71e4e)

### 2.2 Migration des Fichiers (11 fichiers)

#### Fichiers Simples (⚡)

- [x] **2.2.1** `utils/InMemoryStore.js`
  - [x] Convertir prototype → classe ES6
  - [x] `module.exports` → `export class InMemoryStore`
  - [x] Tester : `node -e "import('./utils/InMemoryStore.js')"`
  - [x] Commit : `git commit -m "feat(esm): migrate InMemoryStore to ES6 class"` (54cbb9c)
  - **Notes :**
  ```
  ✅ Conversion réussie de prototype à classe ES6
  ```

- [x] **2.2.2** `azure-config.js`
  - [x] Ajouter imports pour `__dirname` :
    ```javascript
    import { fileURLToPath } from 'url';
    import { dirname } from 'path';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    ```
  - [x] `module.exports` → `export default`
  - [x] Tester import
  - [x] Commit : `git commit -m "feat(esm): migrate azure-config to ES modules"` (c4654d7)
  - **Notes :**
  ```
  ✅ __dirname helper ajouté avec succès
  ```

- [x] **2.2.3** `utils/AzureStreamingClient.js`
  - [x] `require()` → `import` (lignes 6-8)
  - [x] `module.exports` → `export class AzureStreamingClient`
  - [x] Tester import
  - [x] Commit : `git commit -m "feat(esm): migrate AzureStreamingClient to ES modules"` (2582096)
  - **Notes :**
  ```
  ✅ Migration directe, pas de complications
  ```

- [x] **2.2.4** `config.js`
  - [x] `require()` → `import`
  - [x] `module.exports` → `export default`
  - [x] Tester import
  - [x] Commit : `git commit -m "feat(esm): migrate config to ES modules"` (98126d9)
  - **Notes :**
  ```
  ✅ Import explicite d'EJS ajouté
  ```

#### Fichiers Complexes (⚠️)

- [x] **2.2.5** `utils/GPhotoCamera.js`
  - [x] Remplacer `require('gphoto2')` par dynamic import :
    ```javascript
    let GPhoto = null;
    try {
        const module = await import('gphoto2');
        GPhoto = module.default || module.GPhoto2 || module;
    } catch (e) {
        console.warn('[GPHOTO] Module gphoto2 non disponible (normal sur Windows)');
    }
    ```
  - [x] `module.exports` → `export class GPhotoCamera`
  - [x] Tester import
  - [x] Commit : `git commit -m "feat(esm): migrate GPhotoCamera with dynamic import"` (c4d06fe)
  - **Notes :**
  ```
  ✅ Top-level await utilisé pour dynamic import
  ```

- [x] **2.2.6** `utils/WebcamCamera.js`
  - [x] Remplacer `require('node-webcam')` par dynamic import (même pattern)
  - [x] `module.exports` → `export class WebcamCamera`
  - [x] Tester import
  - [x] Commit : `git commit -m "feat(esm): migrate WebcamCamera with dynamic import"` (300dd55)
  - **Notes :**
  ```
  ✅ Dynamic import pour node-webcam réussi
  ```

- [x] **2.2.7** `utils/CameraAdapter.js` - **REFACTORING MAJEUR**
  - [x] Transformer classe en fonction factory async :
    ```javascript
    export async function createCameraAdapter() {
        const platform = process.platform;
        
        console.log(`[CAMERA] Détection de ${platform}`);
        
        if (platform === 'win32') {
            console.log('[CAMERA] Utilisation de la webcam système');
            const { WebcamCamera } = await import('./WebcamCamera.js');
            return new WebcamCamera();
        } else {
            console.log('[CAMERA] Utilisation de gphoto2');
            const { GPhotoCamera } = await import('./GPhotoCamera.js');
            return new GPhotoCamera();
        }
    }
    ```
  - [x] Supprimer l'ancienne classe
  - [x] Tester : `node -e "import('./utils/CameraAdapter.js').then(m => m.createCameraAdapter())"`
  - [x] Commit : `git commit -m "refactor(esm): convert CameraAdapter to async factory function"` (b08b75c)
  - **Notes :**
  ```
  ✅ REFACTORING MAJEUR: Classe → Async Factory Function
  ✅ Change pattern d'utilisation dans tous les fichiers appelants
  ```

- [x] **2.2.8** `routes.js` - **FICHIER PRINCIPAL (326 lignes)**
  - [x] Remplacer tous les `require()` par `import` (lignes 1-6)
  - [x] Ajouter helper `__dirname` :
    ```javascript
    import { fileURLToPath } from 'url';
    import { dirname } from 'path';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    ```
  - [x] Changer `var CameraAdapter = require('./utils/CameraAdapter')` → `import { createCameraAdapter } from './utils/CameraAdapter.js'`
  - [x] Modifier ligne 91 : `var gphoto = new CameraAdapter()` → `var gphoto = await createCameraAdapter()`
  - [x] Rendre `initCamera()` async si nécessaire
  - [x] `module.exports = function(app, io)` → `export default async function(app, io)`
  - [x] Commit : `git commit -m "feat(esm): migrate routes.js to ES modules"` (5b11564)
  - **Notes :**
  ```
  ✅ Top-level await pour createCameraAdapter
  ✅ Fonction d'export rendue async
  ```

- [x] **2.2.9** `server.js`
  - [x] Remplacer tous `require()` par `import`
  - [x] Ajouter `.js` aux imports locaux : `'./config.js'`, `'./routes.js'`
  - [x] Gérer l'import async de routes si nécessaire
  - [x] Commit : `git commit -m "feat(esm): migrate server.js to ES modules"` (b1e5978)
  - **Notes :**
  ```
  ✅ Top-level await pour routes() car fonction async
  ```

- [x] **2.2.10** `PhotoboothStreamer/server.js`
  - [x] Remplacer `require()` par `import` (lignes 1-5)
  - [x] Tester : `cd PhotoboothStreamer && node server.js`
  - [x] Commit : `git commit -m "feat(esm): migrate PhotoboothStreamer to ES modules"` (8064bb3)
  - **Notes :**
  ```
  ✅ Migration simple, pas d'async nécessaire
  ```

- [x] **2.2.11** `install-camera-deps.js` → `install-camera-deps.cjs`
  - [x] Renommer fichier : `git mv install-camera-deps.js install-camera-deps.cjs`
  - [x] Mettre à jour package.json : `"postinstall": "node install-camera-deps.cjs"`
  - [x] Commit : `git commit -m "chore: rename install-camera-deps to .cjs for CommonJS compatibility"` (1cf4c1a)
  - **Notes :**
  ```
  ✅ Gardé en CommonJS car script npm
  ```

### Checkpoint 2A : Test de Démarrage ES Modules

- [x] **Test 1 :** `npm start` démarre sans erreur ESM
- [x] **Test 2 :** Logs affichent : `[CAMERA] Détection de win32`
- [x] **Test 3 :** Logs affichent : `[WEBCAM] Adaptateur webcam initialisé`
- [x] **Test 4 :** Serveur écoute sur port 8181
- [x] **Test 5 :** Aucune erreur `Cannot use import statement outside a module`

**Si tests échouent :** Noter le problème ci-dessous et débugger

```
✅ TOUS LES TESTS PASSENT!
Logs de démarrage:
[AZURE] Initializing Azure Streaming Client...
[CAMERA] Détection de Windows - Utilisation de la webcam système
[WEBCAM] Adaptateur webcam initialisé pour Windows
Chargement des caméras
Caméra initialisée : Webcam (Windows Development Mode)
server running at port 8181
[INFO] Images chargées : 0
```

### Notes de Phase 2

```
✅ PHASE 2 COMPLÉTÉE AVEC SUCCÈS!

Observations:
- Top-level await fonctionne parfaitement avec Node.js v25.3.0
- Pattern async factory function pour CameraAdapter élégant et fonctionnel
- Aucune erreur ESM rencontrée
- Migration fluide en 11 fichiers

Commits créés: 11
- ed71e4e: Enable ES modules in package.json
- 54cbb9c: Migrate InMemoryStore
- c4654d7: Migrate azure-config
- 2582096: Migrate AzureStreamingClient
- 98126d9: Migrate config
- c4d06fe: Migrate GPhotoCamera
- 300dd55: Migrate WebcamCamera
- b08b75c: Refactor CameraAdapter to async factory
- 5b11564: Migrate routes.js
- b1e5978: Migrate server.js
- 8064bb3: Migrate PhotoboothStreamer/server.js
- 1cf4c1a: Rename install-camera-deps to .cjs
```

---

## ⚡ PHASE 3 : Migration Express 5 (1h30)

**Statut :** ⬜ À faire  
**Début :** -  
**Fin :** -

### 3.1 Installation Express 5

- [ ] **3.1.1** Installer Express 5 (projet principal)
  ```bash
  npm install express@5.2.1
  ```
  
- [ ] **3.1.2** Installer Express 5 (PhotoboothStreamer)
  ```bash
  cd PhotoboothStreamer && npm install express@5.2.1 && cd ..
  ```

- [ ] **3.1.3** Commit : `git commit -m "chore: upgrade to Express 5.2.1"`

### 3.2 Codemods Automatiques

- [ ] **3.2.1** Exécuter migration recipe
  ```bash
  npx codemod@latest @expressjs/v5-migration-recipe
  ```
  - **Fichiers modifiés :**
  ```
  
  ```

- [ ] **3.2.2** OU exécuter codemods individuels :
  - [ ] `npx codemod@latest @expressjs/status-send-order`
  - [ ] `npx codemod@latest @expressjs/pluralize-method-names`
  - [ ] `npx codemod@latest @expressjs/explicit-request-params`

- [ ] **3.2.3** Review changements automatiques
- [ ] **3.2.4** Commit : `git commit -m "refactor(express5): apply automatic codemods"`

### 3.3 Changements Manuels

- [ ] **3.3.1** Mettre à jour `server.js` - app.listen
  ```javascript
  // AVANT
  server.listen(port, () => {
    console.log('server running at port ' + port);
  });
  
  // APRÈS
  server.listen(port, (error) => {
    if (error) {
      console.error('[ERROR] Failed to start server:', error);
      process.exit(1);
    }
    console.log('server running at port ' + port);
  });
  ```

- [ ] **3.3.2** Vérifier wildcards dans `routes.js`
  - Rechercher patterns `app.get('/*'` → Remplacer par `app.get('/*splat'` si trouvé
  - **Wildcards trouvés :**
  ```
  
  ```

- [ ] **3.3.3** Vérifier `req.param()` obsolète (normalement détecté par codemod)
  - **Usages trouvés :**
  ```
  
  ```

- [ ] **3.3.4** Vérifier ordre `res.json(data, status)` → `res.status(status).json(data)`
  - **Corrections nécessaires :**
  ```
  
  ```

- [ ] **3.3.5** Commit : `git commit -m "refactor(express5): apply manual breaking changes"`

### 3.4 PhotoboothStreamer Express 5

- [ ] **3.4.1** Appliquer mêmes changements à `PhotoboothStreamer/server.js`
  - [ ] app.listen error handling
  - [ ] Vérifier wildcards
  - [ ] Vérifier res.json/send
  
- [ ] **3.4.2** Commit : `git commit -m "refactor(express5): migrate PhotoboothStreamer to Express 5"`

### Checkpoint 3A : Test Express 5

- [ ] **Test 1 :** `npm start` démarre sans erreur
- [ ] **Test 2 :** Toutes les routes répondent :
  - [ ] `GET http://localhost:8181/`
  - [ ] `GET http://localhost:8181/all-in-one`
  - [ ] `GET http://localhost:8181/controller`
  - [ ] `GET http://localhost:8181/displayer`
  - [ ] `GET http://localhost:8181/manager`
  - [ ] `GET http://localhost:8181/loadPictures`

- [ ] **Test 3 :** Fichiers statiques servis correctement
  - [ ] CSS chargé
  - [ ] JS chargé
  - [ ] MIME types corrects (vérifier console navigateur)

- [ ] **Test 4 :** Socket.IO fonctionne
  - [ ] Connexion établie
  - [ ] Event 'connected' reçu

**Si tests échouent :** Noter le problème

```
[Notes de debugging Checkpoint 3A]


```

### Notes de Phase 3

```
[Observations, difficultés Express 5]


```

---

## 🖼️ PHASE 4 : Migration vers Sharp (1 heure)

**Statut :** ⬜ À faire  
**Début :** -  
**Fin :** -

### 4.1 Installation Sharp

- [ ] **4.1.1** Désinstaller imagemagick
  ```bash
  npm uninstall imagemagick
  ```

- [ ] **4.1.2** Installer sharp
  ```bash
  npm install sharp@^0.34.5
  ```

- [ ] **4.1.3** Commit : `git commit -m "chore: replace imagemagick with sharp"`

### 4.2 Modification routes.js

- [ ] **4.2.1** Remplacer import
  ```javascript
  // Ligne 6 - AVANT
  var imageMagick = require('imagemagick');
  
  // APRÈS
  import sharp from 'sharp';
  ```

- [ ] **4.2.2** Rendre `socket.on('takePicture')` async
  ```javascript
  socket.on('takePicture', async () => {
  ```

- [ ] **4.2.3** Promisifier `camera.takePicture()` (autour ligne 167)
  ```javascript
  const pictureData = await new Promise((resolve, reject) => {
      camera.takePicture({ download: true }, (er, data) => {
          if (er) reject(er);
          else resolve(data);
      });
  });
  ```

- [ ] **4.2.4** Remplacer `fs.writeFileSync` par `fs.promises.writeFile` (ligne 178)
  ```javascript
  await fs.promises.writeFile(PICTURES_DIR + pictureName, pictureData);
  ```

- [ ] **4.2.5** Remplacer thumbnail resize (ligne 192)
  ```javascript
  // AVANT
  imageMagick.resize({
      srcPath: PICTURES_DIR+pictureName,
      dstPath: PICTURES_DIR+'../thumbnails/'+pictureName,
      width: 158
  }, function(err, stdout, stderr){ ... });
  
  // APRÈS
  await sharp(PICTURES_DIR + pictureName)
      .resize(158, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90, progressive: true })
      .toFile(PICTURES_DIR + '../thumbnails/' + pictureName);
  
  console.info("\tThumbnail fait !");
  nspSocket.emit('picture-thumbnail', pictureName);
  ```

- [ ] **4.2.6** Remplacer display resize (ligne 210)
  ```javascript
  // AVANT
  imageMagick.resize({
      srcPath: PICTURES_DIR+pictureName,
      dstPath: PICTURES_DIR+'../display/'+pictureName,
      width: 1024
  }, function(err, stdout, stderr){ ... });
  
  // APRÈS
  await sharp(PICTURES_DIR + pictureName)
      .resize(1024, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90, progressive: true })
      .toFile(PICTURES_DIR + '../display/' + pictureName);
  
  console.info("\tDisplay fait !");
  nspSocket.emit('picture-display', pictureName);
  ```

- [ ] **4.2.7** BONUS : Paralléliser avec Promise.all
  ```javascript
  await Promise.all([
      sharp(...).resize(158)...,
      sharp(...).resize(1024)...
  ]);
  ```

- [ ] **4.2.8** Ajouter try/catch global
  ```javascript
  socket.on('takePicture', async () => {
      try {
          // ... tout le code
      } catch (error) {
          console.error('Erreur prise de photo:', error);
      }
  });
  ```

- [ ] **4.2.9** Commit : `git commit -m "feat(sharp): replace imagemagick with sharp for image processing"`

### 4.3 Ajouter import fs.promises

- [ ] **4.3.1** En haut de routes.js
  ```javascript
  import fs from 'fs';
  // Pas besoin d'import séparé, fs.promises est inclus
  ```

### Checkpoint 4A : Test Sharp

- [ ] **Test 1 :** `npm start` démarre sans erreur
- [ ] **Test 2 :** Prendre une photo via interface web
- [ ] **Test 3 :** Vérifier fichiers générés :
  - [ ] `public/pictures/<timestamp>.jpg` existe
  - [ ] `public/thumbnails/<timestamp>.jpg` existe (158px)
  - [ ] `public/display/<timestamp>.jpg` existe (1024px)

- [ ] **Test 4 :** Qualité image acceptable (ouvrir avec visionneuse)
- [ ] **Test 5 :** Performance mesurée
  ```javascript
  // Ajouter temporairement dans le code
  console.time('sharp-total');
  // ... code sharp
  console.timeEnd('sharp-total');
  // Attendu : < 500ms
  ```
  - **Temps mesuré :** _____ ms

**Si tests échouent :** Noter le problème

```
[Notes de debugging Checkpoint 4A]


```

### Notes de Phase 4

```
[Observations Sharp, performance, qualité]


```

---

## 📦 PHASE 5 : Mise à jour Autres Dépendances (30 minutes)

**Statut :** ⬜ À faire  
**Début :** -  
**Fin :** -

### 5.1 Projet Principal

- [ ] **5.1.1** Mettre à jour cors
  ```bash
  npm install cors@^2.8.6
  ```

- [ ] **5.1.2** Mettre à jour socket.io
  ```bash
  npm install socket.io@^4.8.3
  ```

- [ ] **5.1.3** Mettre à jour socket.io-client
  ```bash
  npm install socket.io-client@^4.8.3
  ```

- [ ] **5.1.4** Mettre à jour node-webcam
  ```bash
  npm update node-webcam
  ```

- [ ] **5.1.5** Commit : `git commit -m "chore: update dependencies to latest versions"`

### 5.2 PhotoboothStreamer

- [ ] **5.2.1** Mettre à jour cors
  ```bash
  cd PhotoboothStreamer && npm install cors@^2.8.6
  ```

- [ ] **5.2.2** Mettre à jour socket.io
  ```bash
  npm install socket.io@^4.8.3
  ```

- [ ] **5.2.3** Mettre à jour uuid
  ```bash
  npm install uuid@^11.1.0
  ```

- [ ] **5.2.4** Vérifier si uuid nécessite changements
  - Rechercher `require('uuid')` ou `import { v4 }` dans PhotoboothStreamer/server.js
  - UUID v11 est rétro-compatible normalement
  - **Changements nécessaires :**
  ```
  
  ```

- [ ] **5.2.5** Commit : `git commit -m "chore(streamer): update dependencies"`

### 5.3 Vérifications

- [ ] **5.3.1** Vérifier package.json final (projet principal)
  ```bash
  cat package.json
  ```

- [ ] **5.3.2** Vérifier package.json final (PhotoboothStreamer)
  ```bash
  cat PhotoboothStreamer/package.json
  ```

- [ ] **5.3.3** Audit de sécurité
  ```bash
  npm audit
  ```
  - **Vulnérabilités restantes :**
  ```
  
  ```

### Checkpoint 5A : Dépendances

- [ ] **Test 1 :** `npm install` fonctionne sans erreur
- [ ] **Test 2 :** `npm start` démarre
- [ ] **Test 3 :** Aucune régression fonctionnelle

**Notes :**

```
[Problèmes de dépendances]


```

---

## ✅ PHASE 6 : Tests Complets (1 heure)

**Statut :** ⬜ À faire  
**Début :** -  
**Fin :** -

### 6.1 Tests de Démarrage

- [ ] **6.1.1** Serveur principal démarre proprement
  ```bash
  npm start
  ```
  - [ ] Pas d'erreur
  - [ ] Port 8181 écoute
  - [ ] Logs corrects

- [ ] **6.1.2** PhotoboothStreamer démarre
  ```bash
  cd PhotoboothStreamer && npm start
  ```
  - [ ] Pas d'erreur
  - [ ] Port 3000 écoute

### 6.2 Tests Endpoints HTTP

- [ ] **6.2.1** GET `/` → Retourne camera.html
  ```bash
  curl http://localhost:8181/
  ```

- [ ] **6.2.2** GET `/all-in-one` → OK
- [ ] **6.2.3** GET `/controller` → OK
- [ ] **6.2.4** GET `/displayer` → OK
- [ ] **6.2.5** GET `/manager` → OK
- [ ] **6.2.6** GET `/loadPictures` → JSON valide
  ```bash
  curl http://localhost:8181/loadPictures
  ```

### 6.3 Tests Socket.IO

**Via navigateur : http://localhost:8181/all-in-one**

- [ ] **6.3.1** Connexion Socket.IO établie
  - Console navigateur : pas d'erreur WebSocket
  - Log serveur : "New connection"

- [ ] **6.3.2** Prendre une photo
  - Cliquer bouton "Prendre Une Photo !"
  - [ ] Countdown affiché
  - [ ] Photo capturée (webcam)
  - [ ] Image affichée dans l'interface
  - [ ] QR code généré

- [ ] **6.3.3** Vérifier fichiers générés
  ```bash
  ls -lh public/pictures/
  ls -lh public/thumbnails/
  ls -lh public/display/
  ```
  - [ ] Fichier picture existe
  - [ ] Fichier thumbnail existe (taille < picture)
  - [ ] Fichier display existe

### 6.4 Tests Fonctionnels Avancés

- [ ] **6.4.1** Test multiple photos (5 photos consécutives)
  - [ ] Pas de memory leak visible
  - [ ] Performance constante

- [ ] **6.4.2** Test QR code
  - [ ] QR code s'affiche
  - [ ] Scan avec téléphone
  - [ ] Lien fonctionne (si Azure configuré)

- [ ] **6.4.3** Test galerie
  - Ouvrir `/controller`
  - [ ] Photos précédentes affichées
  - [ ] Thumbnails chargent

### 6.5 Tests Performance

- [ ] **6.5.1** Mesurer temps total prise de photo
  - Méthode : Chronomètre manuel ou logs timestamps
  - **Temps mesuré :** _____ secondes
  - **Objectif :** < 3 secondes

- [ ] **6.5.2** Mesurer temps redimensionnement Sharp
  - Vérifier logs console.time si ajoutés
  - **Temps thumbnail :** _____ ms
  - **Temps display :** _____ ms
  - **Objectif :** < 500ms chacun

- [ ] **6.5.3** Mémoire
  ```bash
  # Pendant que serveur tourne
  node --expose-gc server.js
  # Vérifier RAM stable
  ```

### 6.6 Tests Compatibilité

- [ ] **6.6.1** Windows (développement)
  - [ ] Webcam détectée
  - [ ] Photos capturées
  - [ ] Qualité acceptable

- [ ] **6.6.2** Raspberry Pi (si disponible)
  - [ ] gphoto2 charge
  - [ ] Appareil photo USB détecté
  - [ ] Photos haute qualité
  - **Note :** ⚠️ À tester en production

### 6.7 Audit Sécurité Final

- [ ] **6.7.1** npm audit
  ```bash
  npm audit
  ```
  - **Vulnérabilités critiques :** ___
  - **Vulnérabilités élevées :** ___
  - **Vulnérabilités moyennes :** ___
  - **Vulnérabilités basses :** ___

- [ ] **6.7.2** Objectif atteint : 0 critical, 0 high

### Résultats Tests

**Tests Passés :** __ / __  
**Tests Échoués :** __  
**Régressions identifiées :**

```
[Liste des régressions]


```

**Bugs trouvés :**

```
[Liste des bugs]


```

---

## 📚 PHASE 7 : Documentation (30 minutes)

**Statut :** ⬜ À faire  
**Début :** -  
**Fin :** -

### 7.1 Créer CHANGELOG.md

- [ ] **7.1.1** Créer fichier `CHANGELOG.md`
  - [ ] Section [2.0.0] avec date
  - [ ] Breaking changes listés
  - [ ] Nouvelles fonctionnalités
  - [ ] Corrections de sécurité
  - [ ] Versions dépendances

- [ ] **7.1.2** Commit : `git commit -m "docs: add CHANGELOG for v2.0.0"`

### 7.2 Mettre à jour README.md

- [ ] **7.2.1** Section Requirements
  - [ ] Node.js >= 18.0.0
  - [ ] Dépendances système (libgphoto2-dev)

- [ ] **7.2.2** Section Installation
  - [ ] Instructions Windows
  - [ ] Instructions Linux/RPI
  - [ ] Mention ES Modules

- [ ] **7.2.3** Section Architecture
  - [ ] Mentionner ES Modules
  - [ ] Mentionner Express 5
  - [ ] Mentionner Sharp

- [ ] **7.2.4** Section Breaking Changes (si upgrade depuis v1)

- [ ] **7.2.5** Commit : `git commit -m "docs: update README for v2.0.0"`

### 7.3 Mettre à jour CAMERA_SETUP.md

- [ ] **7.3.1** Refléter imports ES Modules dans exemples code
- [ ] **7.3.2** Mentionner Sharp au lieu d'ImageMagick
- [ ] **7.3.3** Commit : `git commit -m "docs: update CAMERA_SETUP for ES modules"`

### 7.4 Créer Notes de Migration (optionnel)

- [ ] **7.4.1** Créer `MIGRATION_GUIDE.md` pour utilisateurs
  - Guide pour migrer depuis v1.x
  - Breaking changes détaillés
  - Checklist de migration

### 7.5 Mettre à jour ce fichier

- [ ] **7.5.1** Marquer toutes les phases comme complétées
- [ ] **7.5.2** Ajouter notes finales ci-dessous
- [ ] **7.5.3** Commit : `git commit -m "docs: finalize migration tracker"`

---

## 🎯 RÉCAPITULATIF FINAL

**Date de fin :** -  
**Durée totale :** -  
**Statut global :** ⬜ En cours

### Objectifs Atteints

- [ ] Migration ES Modules complète
- [ ] Express 5 fonctionnel
- [ ] Sharp intégré et performant
- [ ] Toutes dépendances à jour
- [ ] 0 vulnérabilités critiques/élevées
- [ ] Tous tests passent
- [ ] Documentation à jour
- [ ] Code committé et poussé

### Versions Finales

| Composant | Avant | Après |
|-----------|-------|-------|
| Node.js | v25.3.0 | v25.3.0 |
| Modules | CommonJS | ES Modules |
| Express | 4.16.4 | 5.2.1 |
| Socket.IO | 4.7.2 | 4.8.3 |
| Images | imagemagick 0.1.3 | sharp 0.34.5 |
| CORS | 2.7.1 | 2.8.6 |
| UUID | 9.0.0 | 11.1.0 |

### Métriques

- **Lignes de code modifiées :** ~___
- **Fichiers migrés :** 11
- **Commits créés :** ~___
- **Vulnérabilités corrigées :** 8 (4 high, 1 critical)
- **Performance gain (Sharp) :** ~___x

### Problèmes Rencontrés

```
[Liste des problèmes majeurs et leurs solutions]




```

### Leçons Apprises

```
[Points à retenir pour futures migrations]




```

### Actions Post-Migration

- [ ] Tester sur Raspberry Pi en production
- [ ] Monitorer performance en conditions réelles
- [ ] Collecter feedback utilisateurs
- [ ] Créer tests automatisés (Jest/Vitest) - optionnel

---

## 🆘 NOTES DE ROLLBACK (si nécessaire)

**Raison du rollback :** -  
**Date :** -  
**Actions prises :**

```
[Commandes git utilisées pour rollback]




```

**Commit de rollback :** -

---

## 📞 CONTACTS & RESSOURCES

### Documentation
- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)

### Outils Utilisés
- Express 5 Codemods : `npx codemod@latest @expressjs/v5-migration-recipe`
- npm-check-updates : `npx npm-check-updates`

---

## 📝 NOTES ADDITIONNELLES

```
[Espace libre pour notes diverses, idées, TODOs futurs]





```

---

**Dernière mise à jour :** 25 janvier 2026  
**Statut :** ⬜ Migration non démarrée

---

**Instructions d'utilisation de ce fichier :**

1. Cocher `[x]` chaque tâche complétée
2. Remplir les champs avec `-` par les valeurs réelles
3. Ajouter notes dans les sections `Notes`
4. Mettre à jour statuts : ⬜ → 🟦 → ✅
5. Commiter ce fichier régulièrement : `git add MIGRATION_TRACKER.md && git commit -m "docs: update migration progress"`
