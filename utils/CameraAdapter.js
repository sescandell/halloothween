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

/**
 * Factory function async qui retourne l'implémentation appropriée selon la plateforme
 * @returns {Promise<WebcamCamera|GPhotoCamera>}
 */
export async function createCameraAdapter() {
    const platform = process.platform;
    
    if (platform === 'win32') {
        // Windows : Mode développement avec webcam
        console.log('[CAMERA] Détection de Windows - Utilisation de la webcam système');
        const { WebcamCamera } = await import('./WebcamCamera.js');
        return new WebcamCamera();
    } else {
        // Linux/Unix : Mode production avec gphoto2
        console.log('[CAMERA] Détection de ' + platform + ' - Utilisation de gphoto2');
        const { GPhotoCamera } = await import('./GPhotoCamera.js');
        return new GPhotoCamera();
    }
}
