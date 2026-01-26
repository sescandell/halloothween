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
let CameraEventType = null;

// Dynamic import pour @photobot/gphoto2-camera (module optionnel)
try {
    const module = await import('@photobot/gphoto2-camera');
    gphoto2Camera = module;
    // Importer l'enum CameraEventType pour vérification des événements
    CameraEventType = module.CameraEventType;
    console.log('[GPHOTO2] Module @photobot/gphoto2-camera chargé avec succès');
} catch (e) {
    console.warn('[GPHOTO2] Module @photobot/gphoto2-camera non disponible:', e.message);
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
     * Obtient le nom de l'événement pour les logs
     * @param {number} eventType - Type d'événement (numérique)
     * @returns {string} - Nom de l'événement
     */
    _getEventTypeName(eventType) {
        if (!CameraEventType) return `Type ${eventType}`;
        
        const names = {
            [CameraEventType.Unknown]: 'Unknown',
            [CameraEventType.Timeout]: 'Timeout',
            [CameraEventType.FileAdded]: 'FileAdded',
            [CameraEventType.FolderAdded]: 'FolderAdded',
            [CameraEventType.CaptureComplete]: 'CaptureComplete',
            [CameraEventType.FileChanged]: 'FileChanged'
        };
        
        return names[eventType] || `Type ${eventType}`;
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
            console.log('[GPHOTO2] Capture déclenchée, attente des événements...');
            
            // Boucler sur les événements jusqu'à recevoir FileAdded ou timeout
            // Inspiration: https://github.com/Photobot-Co/gphoto2-camera/blob/main/test.ts
            let cameraEvent;
            let attempts = 0;
            const maxAttempts = 15; // 15 secondes max (15 × 1000ms)
            
            do {
                attempts++;
                // Attendre un événement avec timeout de 1000ms par itération
                cameraEvent = await this.lib.waitForEventAsync(this.cameraInfo, 1000);
                
                const eventName = this._getEventTypeName(cameraEvent.type);
                console.log(`[GPHOTO2] Événement reçu (tentative ${attempts}/${maxAttempts}): ${eventName} (type=${cameraEvent.type})`);
                
                // Si l'événement est FileAdded (type === 2), télécharger le fichier
                if (cameraEvent.type === 2 && cameraEvent.path) {
                    console.log(`[GPHOTO2] Fichier capturé: ${cameraEvent.path.folder}/${cameraEvent.path.name}`);
                    
                    // Télécharger le fichier dans un buffer temporaire
                    const tempPath = `/tmp/gphoto2-${Date.now()}.jpg`;
                    console.log(`[GPHOTO2] Téléchargement vers: ${tempPath}`);
                    await this.lib.getFileAsync(this.cameraInfo, cameraEvent.path, tempPath);
                    
                    // Lire le fichier
                    console.log('[GPHOTO2] Lecture du fichier téléchargé...');
                    const data = await fs.readFile(tempPath);
                    console.log(`[GPHOTO2] Fichier lu: ${data.length} octets`);
                    
                    // Nettoyer le fichier temporaire
                    await fs.unlink(tempPath);
                    console.log('[GPHOTO2] Fichier temporaire nettoyé');
                    
                    console.log('[GPHOTO2] ✓ Capture réussie');
                    return data;
                }
                
                // Si timeout après plusieurs tentatives, arrêter
                if (attempts >= maxAttempts) {
                    throw new Error(`[GPHOTO2] Timeout après ${maxAttempts} tentatives sans recevoir de fichier`);
                }
                
            } while (cameraEvent.type !== 1); // 1 = Timeout (arrêter si timeout natif)
            
            // Si on sort de la boucle sans avoir reçu de fichier
            throw new Error('[GPHOTO2] Aucun fichier reçu après la capture (événement Timeout reçu)');
            
        } catch (error) {
            console.error('[GPHOTO2] Erreur lors de la capture:', error);
            throw error;
        }
    }
}
