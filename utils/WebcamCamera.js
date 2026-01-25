/**
 * WebcamCamera - Implémentation de capture via webcam système
 * Compatible avec l'API gphoto2 pour le développement sur Windows
 */

var NodeWebcam;
try {
    NodeWebcam = require('node-webcam');
} catch (e) {
    console.warn('[WEBCAM] Module node-webcam non disponible (normal sur Linux)');
    NodeWebcam = null;
}

/**
 * Wrapper qui simule l'API gphoto2 mais utilise la webcam système
 */
class WebcamCamera {
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
        console.log('[WEBCAM] Adaptateur webcam initialisé pour Windows');
    }

    /**
     * Liste les "caméras" disponibles (simule l'API gphoto2)
     * Retourne toujours une caméra virtuelle représentant la webcam système
     * @param {Function} callback - callback(cameras)
     */
    list(callback) {
        // Simule la structure de gphoto2 avec une caméra virtuelle
        var virtualCamera = new WebcamCameraInstance(this.webcam, this.opts);
        
        // Retourne un tableau avec une seule caméra (comme gphoto2)
        callback([virtualCamera]);
    }
}

/**
 * Instance de caméra virtuelle qui simule l'API d'une caméra gphoto2
 */
class WebcamCameraInstance {
    constructor(webcam, opts) {
        this.webcam = webcam;
        this.opts = opts;
        this.model = "Webcam (Windows Development Mode)";
    }

    /**
     * Prend une photo avec la webcam
     * @param {Object} options - Options de capture (compatible gphoto2)
     * @param {Function} callback - callback(error, pictureData)
     */
    takePicture(options, callback) {
        console.log('[WEBCAM] Capture en cours...');
        
        this.webcam.capture('temp', (err, data) => {
            if (err) {
                console.error('[WEBCAM] Erreur lors de la capture:', err);
                callback(err, null);
                return;
            }
            
            console.log('[WEBCAM] Capture réussie');
            // data est déjà un Buffer grâce à callbackReturn: "buffer"
            callback(null, data);
        });
    }
}

module.exports = WebcamCamera;
