/**
 * WebcamCamera - Implémentation de capture via webcam système
 * Version async/await - Compatible avec tous les OS
 */

let NodeWebcam = null;

// Dynamic import pour node-webcam (module optionnel)
try {
    const webcamModule = await import('node-webcam');
    NodeWebcam = webcamModule.default || webcamModule;
} catch (e) {
    console.warn('[WEBCAM] Module node-webcam non disponible');
}

/**
 * Wrapper qui utilise la webcam système avec API async/await
 */
export class WebcamCamera {
    constructor() {
        if (!NodeWebcam) {
            throw new Error('[WEBCAM] node-webcam module is not available. Cannot use WebcamCamera on this platform.');
        }
        
        // Configuration de la webcam
        this.opts = {
            width: 1920,
            height: 1080,
            quality: 100,
            delay: 0,
            saveShots: false,  // On ne sauvegarde pas, on retourne juste le buffer
            output: "jpeg",
            device: false,     // Utilise la webcam par défaut
            callbackReturn: "buffer",  // Retourne directement le buffer
            verbose: false
        };
        
        this.webcam = NodeWebcam.create(this.opts);
        console.log('[WEBCAM] Adaptateur webcam initialisé');
    }

    /**
     * Liste les "caméras" disponibles
     * Retourne toujours une caméra virtuelle représentant la webcam système
     * @returns {Promise<Array>}
     */
    async list() {
        // Simule la structure avec une caméra virtuelle
        const virtualCamera = new WebcamCameraInstance(this.webcam, this.opts);
        
        // Retourne un tableau avec une seule caméra
        return [virtualCamera];
    }
}

/**
 * Instance de caméra virtuelle avec API async/await
 */
class WebcamCameraInstance {
    constructor(webcam, opts) {
        this.webcam = webcam;
        this.opts = opts;
        this.model = "Webcam (Windows Development Mode)";
    }

    /**
     * Prend une photo avec la webcam
     * @param {Object} options - Options de capture
     * @returns {Promise<Buffer>} - Buffer de l'image capturée
     */
    async takePicture(options = {}) {
        console.log('[WEBCAM] Capture en cours...');
        
        return new Promise((resolve, reject) => {
            this.webcam.capture('temp', (err, data) => {
                if (err) {
                    console.error('[WEBCAM] Erreur lors de la capture:', err);
                    reject(err);
                    return;
                }
                
                console.log('[WEBCAM] Capture réussie');
                // data est déjà un Buffer grâce à callbackReturn: "buffer"
                resolve(data);
            });
        });
    }
}
