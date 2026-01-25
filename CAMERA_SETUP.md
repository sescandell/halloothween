# Configuration Caméra - Développement Multi-Plateforme

Ce projet utilise un système d'adaptation de caméra qui permet le développement sur Windows tout en conservant la compatibilité avec gphoto2 en production sur Raspberry Pi.

**Version 2.0.0** : Ce document a été mis à jour pour refléter l'utilisation des **ES Modules** et de **Sharp** pour le traitement d'images.

## Fonctionnement

Le système détecte automatiquement la plateforme et charge l'implémentation appropriée :

### Sur Windows (Développement)
- **Implémentation** : `WebcamCamera` (via `node-webcam`)
- **Source** : Webcam système (par défaut)
- **Format** : BMP (converti automatiquement en JPEG via `bmpToSharp.js`)
- **Avantages** : Pas besoin d'appareil photo USB, développement simplifié
- **Log attendu** : `[CAMERA] Détection de Windows - Utilisation de la webcam système`
- **Mode capture** : Pause du stream vidéo (configuré via `PAUSE_STREAM_ON_CAPTURE=true`)

### Sur Linux/Raspberry Pi (Production)
- **Implémentation** : `GPhotoCamera` (via `gphoto2`)
- **Source** : Appareil photo connecté en USB (Canon, Nikon, etc.)
- **Format** : JPEG natif
- **Avantages** : Qualité professionnelle, contrôle avancé de l'appareil
- **Log attendu** : `[CAMERA] Détection de linux - Utilisation de gphoto2`
- **Mode capture** : Direct (configuré via `PAUSE_STREAM_ON_CAPTURE=false`)

## Architecture

```
createCameraAdapter() (Async Factory)
├── WebcamCamera (Windows)
│   └── node-webcam → BMP → bmpToSharp → Sharp → JPEG
└── GPhotoCamera (Linux/Unix)
    └── gphoto2 + libgphoto2 → JPEG natif → Sharp
```

### ES Modules (v2.0.0+)

Le projet utilise maintenant les **ES Modules** au lieu de CommonJS :

```javascript
// ✅ v2.0.0+ (ES Modules)
import { createCameraAdapter } from './utils/CameraAdapter.js';

// Async factory function
const camera = await createCameraAdapter();

// ❌ v1.x (CommonJS - obsolète)
const CameraAdapter = require('./utils/CameraAdapter');
const camera = new CameraAdapter();
```

## Fichiers créés

- `utils/CameraAdapter.js` - **Async factory function** qui détecte la plateforme et charge l'implémentation
- `utils/WebcamCamera.js` - Implémentation webcam pour Windows (ES Modules)
- `utils/GPhotoCamera.js` - Encapsulation de gphoto2 pour Linux (ES Modules)
- `utils/bmpToSharp.js` - **Nouveau** : Détection et conversion automatique BMP → Sharp
- `install-camera-deps.cjs` - Script d'installation automatique (CommonJS pour npm scripts)

## Dépendances

Les dépendances sont installées automatiquement selon la plateforme détectée lors du `npm install`.

### Windows (Développement)
```json
{
  "node-webcam": "^0.8.1",  // Installée automatiquement sur Windows uniquement
  "bmp-ts": "^1.0.9",       // Nouveau : support BMP format
  "sharp": "^0.34.5"        // Traitement d'images moderne
}
```

### Linux/Raspberry Pi (Production)
```json
{
  "gphoto2": "^0.3.2",      // Installée automatiquement sur Linux uniquement
  "sharp": "^0.34.5"        // Traitement d'images moderne
}
```

**Important** : Les modules caméra sont des `optionalDependencies` et s'installent automatiquement selon votre plateforme grâce au script `install-camera-deps.cjs`.

- Sur Windows : Seul `node-webcam` est installé
- Sur Linux : Seul `gphoto2` est installé
- **Sharp** est installé sur toutes les plateformes (remplace ImageMagick)

## Installation

### Sur Windows
```bash
# Node.js >= 18.0.0 requis
node --version  # Doit être >= 18.0.0

npm install
```
Vous verrez :
```
[CAMERA SETUP] Détection de la plateforme : win32
[CAMERA SETUP] Installation de node-webcam pour Windows...
[CAMERA SETUP] ✓ node-webcam installé avec succès
```

### Sur Linux/Raspberry Pi
```bash
# Installer Node.js >= 18.0.0
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer les dépendances système
sudo apt install libgphoto2-dev

# Sharp n'a plus besoin d'ImageMagick
# sudo apt install imagemagick  # ❌ Plus nécessaire !

# Installer les dépendances Node.js
npm install
```
Vous verrez :
```
[CAMERA SETUP] Détection de la plateforme : linux
[CAMERA SETUP] Installation de gphoto2 pour Linux/Unix...
[CAMERA SETUP] ✓ gphoto2 installé avec succès
```

## Configuration (.env)

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

**Windows** :
```bash
PAUSE_STREAM_ON_CAPTURE=true   # Pause le flux vidéo avant capture
AZURE_ENABLED=false             # Désactiver Azure en dev
```

**Linux/Raspberry Pi** :
```bash
PAUSE_STREAM_ON_CAPTURE=false  # Capture directe (recommandé avec gphoto2)
AZURE_ENABLED=true              # Activer si Azure configuré
AZURE_STREAMER_URL=https://your-app.azurewebsites.net
SHARED_SECRET=your-secret
RPI_ID=rpi-001
```

## Utilisation

### Importation ES Modules

```javascript
// routes.js ou tout autre fichier
import { createCameraAdapter } from './utils/CameraAdapter.js';

// Initialisation asynchrone
const camera = await createCameraAdapter();

// Liste les caméras
camera.list((cameras) => {
    if (cameras.length > 0) {
        const cam = cameras[0];
        console.log('Caméra :', cam.model);
    }
});
```

### Prise de Photo

```javascript
// Async/await pattern (recommandé v2.0.0+)
const pictureData = await new Promise((resolve, reject) => {
    camera.takePicture({ download: true }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
    });
});

// pictureData est un Buffer (BMP sur Windows, JPEG sur Linux)
```

### Traitement avec Sharp (v2.0.0+)

```javascript
import sharp from 'sharp';
import { smartSharp } from './utils/bmpToSharp.js';

// smartSharp détecte automatiquement le format BMP et convertit si nécessaire
const sharpInstance = smartSharp(pictureData);

// Sauvegarder l'original
await sharpInstance
    .clone()
    .jpeg({ quality: 95, progressive: true })
    .toFile('public/pictures/photo.jpg');

// Générer thumbnail et display en parallèle
await Promise.all([
    // Thumbnail 158px
    sharpInstance
        .clone()
        .resize(158, null, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, progressive: true })
        .toFile('public/thumbnails/photo.jpg'),
    
    // Display 1024px
    sharpInstance
        .clone()
        .resize(1024, null, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, progressive: true })
        .toFile('public/display/photo.jpg')
]);
```

## API Commune

Les deux implémentations exposent la même API, garantissant la compatibilité :

```javascript
// Liste les caméras disponibles
camera.list(function(cameras) {
    if (cameras.length > 0) {
        var cam = cameras[0];
        console.log('Caméra : ' + cam.model);
        
        // Prend une photo
        cam.takePicture({ download: true }, function(err, data) {
            // data est un Buffer contenant l'image (BMP ou JPEG)
            // Utilisez smartSharp(data) pour traiter automatiquement
        });
    }
});
```

## Traitement d'Images : Sharp vs ImageMagick

### ❌ v1.x (ImageMagick - obsolète)

```javascript
// OLD - Ne fonctionne plus en v2.0.0
var imageMagick = require('imagemagick');
imageMagick.resize({
    srcPath: 'input.jpg',
    dstPath: 'output.jpg',
    width: 158
}, callback);
```

### ✅ v2.0.0+ (Sharp - moderne)

```javascript
// NEW - Performant et moderne
import sharp from 'sharp';

await sharp('input.jpg')
    .resize(158, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90, progressive: true })
    .toFile('output.jpg');
```

**Avantages de Sharp** :
- ✅ 2-3x plus rapide qu'ImageMagick
- ✅ Async/await natif (Promises)
- ✅ Pas de dépendances système (pure JavaScript)
- ✅ Traitement parallèle avec `Promise.all`
- ✅ Support BMP, JPEG, PNG, WebP, TIFF, etc.

## Troubleshooting

### Windows : "Webcam not found"
- Vérifiez que votre webcam est bien connectée
- Vérifiez qu'aucune autre application n'utilise la webcam
- Testez avec l'application Caméra de Windows
- Vérifiez les permissions dans Paramètres > Confidentialité > Caméra

### Windows : "Stream pause timeout"
- **Solution** : Fermez les onglets navigateur multiples (un seul client à la fois)
- Vérifiez que `PAUSE_STREAM_ON_CAPTURE=true` dans `.env`
- Le timeout est normal si le stream ne peut pas être pausé

### Linux : "No camera found"
- Vérifiez que l'appareil est bien connecté en USB
- Testez avec `gphoto2 --auto-detect`
- Vérifiez les permissions : `sudo killall gvfsd-gphoto2`
- Assurez-vous que Node.js >= 18.0.0 est installé

### "Cannot use import statement outside a module"
- Vérifiez que Node.js >= 18.0.0 est installé
- Vérifiez que `package.json` contient `"type": "module"`
- Ne mélangez pas `require()` et `import` (utilisez toujours `import`)

### "Sharp installation failed"
- Réinstallez Sharp : `npm install --force sharp`
- Sur Raspberry Pi : assurez-vous d'avoir assez d'espace disque
- Vérifiez la version de Node.js : `node --version` (doit être >= 18)

### Images BMP non traitées (Windows)
- Vérifiez que `bmp-ts` est installé : `npm list bmp-ts`
- Les logs devraient afficher `[IMAGE] BMP format detected, converting...`
- Si problème persiste, utilisez `sharp(buffer)` directement (Sharp gère aussi BMP)
