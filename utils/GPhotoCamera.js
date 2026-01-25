/**
 * GPhotoCamera - Encapsulation de gphoto2 pour la production
 * Utilise libgphoto2 pour contrôler des appareils photo via USB
 */

let GPhoto = null;

// Dynamic import pour gphoto2 (module optionnel)
try {
    const gphotoModule = await import('gphoto2');
    GPhoto = gphotoModule.default || gphotoModule.GPhoto2 || gphotoModule;
} catch (e) {
    console.warn('[GPHOTO] Module gphoto2 non disponible (normal sur Windows)');
}

/**
 * Wrapper autour de gphoto2 qui expose l'API standard
 */
export class GPhotoCamera {
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
