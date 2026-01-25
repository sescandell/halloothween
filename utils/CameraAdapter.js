/**
 * CameraAdapter - Factory qui choisit automatiquement l'implémentation de caméra
 * 
 * Détection automatique selon la plateforme :
 * - Windows (win32) : Utilise WebcamCamera (développement)
 * - Linux/Unix : Utilise GPhotoCamera (production)
 * 
 * Cette abstraction permet de développer sur Windows tout en gardant
 * la compatibilité avec gphoto2 en production sur Raspberry Pi
 */

var WebcamCamera = require('./WebcamCamera');
var GPhotoCamera = require('./GPhotoCamera');

/**
 * Factory qui retourne l'implémentation appropriée selon la plateforme
 */
class CameraAdapter {
    constructor() {
        var platform = process.platform;
        
        if (platform === 'win32') {
            // Windows : Mode développement avec webcam
            console.log('[CAMERA] Détection de Windows - Utilisation de la webcam système');
            return new WebcamCamera();
        } else {
            // Linux/Unix : Mode production avec gphoto2
            console.log('[CAMERA] Détection de ' + platform + ' - Utilisation de gphoto2');
            return new GPhotoCamera();
        }
    }
}

module.exports = CameraAdapter;
