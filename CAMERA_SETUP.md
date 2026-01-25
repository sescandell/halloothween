# Configuration Caméra - Développement Multi-Plateforme

Ce projet utilise un système d'adaptation de caméra qui permet le développement sur Windows tout en conservant la compatibilité avec gphoto2 en production sur Raspberry Pi.

## Fonctionnement

Le système détecte automatiquement la plateforme et charge l'implémentation appropriée :

### Sur Windows (Développement)
- **Implémentation** : `WebcamCamera` (via `node-webcam`)
- **Source** : Webcam système (par défaut)
- **Avantages** : Pas besoin d'appareil photo USB, développement simplifié
- **Log attendu** : `[CAMERA] Détection de Windows - Utilisation de la webcam système`

### Sur Linux/Raspberry Pi (Production)
- **Implémentation** : `GPhotoCamera` (via `gphoto2`)
- **Source** : Appareil photo connecté en USB (Canon, Nikon, etc.)
- **Avantages** : Qualité professionnelle, contrôle avancé de l'appareil
- **Log attendu** : `[CAMERA] Détection de linux - Utilisation de gphoto2`

## Architecture

```
CameraAdapter (Factory)
├── WebcamCamera (Windows)
│   └── node-webcam
└── GPhotoCamera (Linux/Unix)
    └── gphoto2 + libgphoto2
```

## Fichiers créés

- `utils/CameraAdapter.js` - Factory qui détecte la plateforme et charge l'implémentation
- `utils/WebcamCamera.js` - Implémentation webcam pour Windows
- `utils/GPhotoCamera.js` - Encapsulation de gphoto2 pour Linux
- `install-camera-deps.js` - Script d'installation automatique des dépendances selon la plateforme

## Dépendances

Les dépendances sont installées automatiquement selon la plateforme détectée lors du `npm install`.

### Windows (Développement)
```json
{
  "node-webcam": "^0.8.1"  // Installée automatiquement sur Windows uniquement
}
```

### Linux/Raspberry Pi (Production)
```json
{
  "gphoto2": "^0.3.2"  // Installée automatiquement sur Linux uniquement
}
```

**Important** : Les deux modules sont des `optionalDependencies` et s'installent automatiquement selon votre plateforme grâce au script `install-camera-deps.js`.

- Sur Windows : Seul `node-webcam` est installé
- Sur Linux : Seul `gphoto2` est installé

## Installation

### Sur Windows
```bash
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
# Installer les dépendances système
sudo apt install libgphoto2-dev

# Installer les dépendances Node.js
npm install
```
Vous verrez :
```
[CAMERA SETUP] Détection de la plateforme : linux
[CAMERA SETUP] Installation de gphoto2 pour Linux/Unix...
[CAMERA SETUP] ✓ gphoto2 installé avec succès
```

## Utilisation

Aucune configuration nécessaire ! Le système détecte automatiquement votre plateforme.

Pour développer :
1. Sur Windows : Branchez votre webcam (ou utilisez la webcam intégrée)
2. Sur Linux : Connectez votre appareil photo en USB
3. Lancez le serveur : `npm start`

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
            // data est un Buffer contenant l'image JPEG
        });
    }
});
```

## Troubleshooting

### Windows : "Webcam not found"
- Vérifiez que votre webcam est bien connectée
- Vérifiez qu'aucune autre application n'utilise la webcam
- Testez avec l'application Caméra de Windows

### Linux : "No camera found"
- Vérifiez que l'appareil est bien connecté en USB
- Testez avec `gphoto2 --auto-detect`
- Vérifiez les permissions : `sudo killall gvfsd-gphoto2`

## Désactivation du mode automatique

Si vous souhaitez forcer une implémentation spécifique, modifiez `utils/CameraAdapter.js` :

```javascript
// Force l'utilisation de la webcam même sur Linux
return new WebcamCamera();

// Force l'utilisation de gphoto2 (ne fonctionnera pas sur Windows)
return new GPhotoCamera();
```
