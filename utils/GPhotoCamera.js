/**
 * GPhotoCamera - Encapsulation de gphoto2 pour la production
 * Utilise libgphoto2 pour contrôler des appareils photo via USB
 */

var GPhoto;
try {
    GPhoto = require('gphoto2');
} catch (e) {
    console.warn('[GPHOTO] Module gphoto2 non disponible (normal sur Windows)');
    GPhoto = null;
}

/**
 * Wrapper autour de gphoto2 qui expose l'API standard
 */
class GPhotoCamera {
    constructor() {
        if (!GPhoto) {
            throw new Error('[GPHOTO] gphoto2 module is not available. Cannot use GPhotoCamera on this platform.');
        }
        
        this.gphoto = new GPhoto.GPhoto2();
        console.log('[GPHOTO] Adaptateur gphoto2 initialisé pour appareil photo USB');
    }

    /**
     * Liste les caméras connectées via USB
     * @param {Function} callback - callback(cameras)
     */
    list(callback) {
        this.gphoto.list(callback);
    }
}

module.exports = GPhotoCamera;
