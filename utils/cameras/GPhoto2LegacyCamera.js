/**
 * GPhoto2LegacyCamera - Encapsulation de l'ancien driver gphoto2 (DEPRECATED)
 * 
 * ⚠️  WARNING: Ce driver utilise le package npm 'gphoto2' qui n'est plus maintenu depuis 2022.
 * Il est conservé uniquement comme fallback pour assurer la rétrocompatibilité.
 * 
 * Recommandation: Utilisez GPhoto2Camera (@photobot/gphoto2-camera) à la place.
 * 
 * Utilise libgphoto2 pour contrôler des appareils photo via USB
 */

let GPhoto = null;

// Dynamic import pour gphoto2 (module optionnel)
try {
    const gphotoModule = await import('gphoto2');
    GPhoto = gphotoModule.default || gphotoModule.GPhoto2 || gphotoModule;
} catch (e) {
    console.warn('[GPHOTO2-LEGACY] Module gphoto2 non disponible');
}

/**
 * Wrapper autour du vieux package gphoto2 avec API async/await
 */
export class GPhoto2LegacyCamera {
    constructor() {
        if (!GPhoto) {
            throw new Error('[GPHOTO2-LEGACY] gphoto2 module is not available. Cannot use GPhoto2LegacyCamera on this platform.');
        }
        
        this.gphoto = new GPhoto.GPhoto2();
        console.log('[GPHOTO2-LEGACY] ⚠️  Adaptateur legacy gphoto2 initialisé (deprecated)');
        console.warn('[GPHOTO2-LEGACY] ⚠️  Ce driver n\'est plus maintenu depuis 2022');
    }

    /**
     * Liste les caméras connectées via USB
     * @returns {Promise<Array>}
     */
    async list() {
        return new Promise((resolve) => {
            this.gphoto.list((cameras) => {
                resolve(cameras);
            });
        });
    }
}
