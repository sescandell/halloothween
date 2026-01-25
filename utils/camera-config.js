/**
 * Configuration et validation du driver caméra
 * 
 * Ce module gère la sélection et la validation des drivers caméra disponibles.
 * Il supporte plusieurs drivers avec détection automatique selon la plateforme.
 */

export const CAMERA_DRIVERS = {
    AUTO: 'auto',
    WEBCAM: 'webcam',
    GPHOTO2: 'gphoto2',              // Nouveau driver (recommandé)
    GPHOTO2_LEGACY: 'gphoto2-legacy' // Ancien driver (deprecated)
};

/**
 * Récupère la configuration du driver caméra depuis les variables d'environnement
 * @returns {string} - Le driver configuré (validé)
 */
export function getCameraConfig() {
    const configValue = process.env.CAMERA_DRIVER || CAMERA_DRIVERS.AUTO;
    const driver = configValue.toLowerCase();
    
    // Validation
    const validDrivers = Object.values(CAMERA_DRIVERS);
    if (!validDrivers.includes(driver)) {
        console.warn(`[CAMERA CONFIG] Invalid CAMERA_DRIVER: "${driver}". Using "auto".`);
        return CAMERA_DRIVERS.AUTO;
    }
    
    return driver;
}

/**
 * Résout le driver à utiliser selon la plateforme si mode AUTO
 * @param {string} driver - Le driver configuré
 * @param {string} platform - La plateforme (process.platform par défaut)
 * @returns {string} - Le driver résolu
 */
export function resolveDriverForPlatform(driver, platform = process.platform) {
    // Si mode auto, résoudre selon la plateforme
    if (driver === CAMERA_DRIVERS.AUTO) {
        if (platform === 'win32') {
            console.log('[CAMERA CONFIG] Auto-detect: Windows → webcam');
            return CAMERA_DRIVERS.WEBCAM;
        } else {
            console.log('[CAMERA CONFIG] Auto-detect: Linux → gphoto2 (with legacy fallback)');
            return CAMERA_DRIVERS.GPHOTO2;
        }
    }
    
    return driver;
}

/**
 * Retourne le nom d'affichage d'un driver
 * @param {string} driver - Le driver
 * @returns {string} - Le nom d'affichage
 */
export function getDriverDisplayName(driver) {
    const names = {
        [CAMERA_DRIVERS.WEBCAM]: 'Webcam (node-webcam)',
        [CAMERA_DRIVERS.GPHOTO2]: 'GPhoto2 (@photobot/gphoto2-camera)',
        [CAMERA_DRIVERS.GPHOTO2_LEGACY]: 'GPhoto2 Legacy (deprecated)'
    };
    return names[driver] || driver;
}
