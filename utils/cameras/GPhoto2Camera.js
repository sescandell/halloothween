/**
 * GPhoto2Camera - Driver moderne utilisant @photobot/gphoto2-camera
 * 
 * Ce driver utilise le package @photobot/gphoto2-camera qui :
 * - Est activement maintenu (2025)
 * - Utilise Koffi FFI (pas de compilation native)
 * - Offre une API async/await native
 * - Est plus fiable et performant
 * 
 * Documentation: https://github.com/Photobot-Co/gphoto2-camera
 */

import { promises as fs } from 'fs';

let gphoto2Camera = null;

// Dynamic import pour @photobot/gphoto2-camera (module optionnel)
try {
    const module = await import('@photobot/gphoto2-camera');
    gphoto2Camera = module;
} catch (e) {
    console.warn('[GPHOTO2] Module @photobot/gphoto2-camera non disponible');
}

/**
 * Wrapper pour @photobot/gphoto2-camera avec API standardisée
 */
export class GPhoto2Camera {
    constructor() {
        if (!gphoto2Camera) {
            throw new Error('[GPHOTO2] @photobot/gphoto2-camera module is not available. Cannot use GPhoto2Camera on this platform.');
        }
        
        this.lib = null;
        this.cameraInfo = null;
        console.log('[GPHOTO2] Adaptateur @photobot/gphoto2-camera initialisé');
    }

    /**
     * Liste les caméras connectées via USB
     * @returns {Promise<Array>}
     */
    async list() {
        try {
            // Charger la librairie
            if (!this.lib) {
                this.lib = await gphoto2Camera.load();
            }
            
            // Lister les caméras
            const cameras = await this.lib.listAsync();
            
            if (!cameras || cameras.length === 0) {
                console.warn('[GPHOTO2] Aucune caméra détectée');
                return [];
            }
            
            console.log(`[GPHOTO2] ${cameras.length} caméra(s) détectée(s)`);
            
            // Ouvrir la première caméra
            this.cameraInfo = cameras[0];
            await this.lib.openAsync(this.cameraInfo);
            console.log(`[GPHOTO2] Caméra ouverte: ${this.cameraInfo.name}`);
            
            // Convertir au format attendu par le code existant
            const formattedCameras = cameras.map(cam => new GPhoto2CameraInstance(this.lib, cam));
            
            return formattedCameras;
        } catch (error) {
            console.error('[GPHOTO2] Erreur lors du listing des caméras:', error);
            throw error;
        }
    }
}

/**
 * Instance de caméra avec API async/await
 */
class GPhoto2CameraInstance {
    constructor(lib, cameraInfo) {
        this.lib = lib;
        this.cameraInfo = cameraInfo;
        this.model = cameraInfo.name;
    }

    /**
     * Prend une photo avec la caméra
     * @param {Object} options - Options de capture
     * @returns {Promise<Buffer>} - Buffer de l'image capturée
     */
    async takePicture(options = {}) {
        console.log('[GPHOTO2] Déclenchement de la capture...');
        
        try {
            // Déclencher la capture
            await this.lib.triggerCaptureAsync(this.cameraInfo);
            
            // Attendre l'événement de fichier ajouté
            const event = await this.lib.waitForEventAsync(this.cameraInfo, 5000);
            
            if (event.type === gphoto2Camera.CameraEventType?.FileAdded && event.path) {
                console.log(`[GPHOTO2] Fichier capturé: ${event.path.name}`);
                
                // Télécharger le fichier dans un buffer temporaire
                const tempPath = `/tmp/gphoto2-${Date.now()}.jpg`;
                await this.lib.getFileAsync(this.cameraInfo, event.path, tempPath);
                
                // Lire le fichier
                const data = await fs.readFile(tempPath);
                
                // Nettoyer le fichier temporaire
                await fs.unlink(tempPath);
                
                console.log('[GPHOTO2] Capture réussie');
                return data;
            }
            
            throw new Error('[GPHOTO2] Aucun fichier reçu après la capture');
            
        } catch (error) {
            console.error('[GPHOTO2] Erreur lors de la capture:', error);
            throw error;
        }
    }
}
