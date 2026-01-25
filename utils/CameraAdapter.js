/**
 * CameraAdapter - Factory avec configuration flexible du driver
 * 
 * Supporte plusieurs drivers :
 * - "auto" : Détection automatique selon la plateforme
 * - "webcam" : Webcam système (Windows/Linux)
 * - "gphoto2" : Nouveau driver moderne (@photobot/gphoto2-camera)
 * - "gphoto2-legacy" : Ancien driver (deprecated)
 * 
 * Configuration via CAMERA_DRIVER dans .env
 */

import { CAMERA_DRIVERS, getCameraConfig, resolveDriverForPlatform, getDriverDisplayName } from './camera-config.js';

/**
 * Crée et retourne une instance de caméra adaptée
 * @param {string} driverOverride - Override du driver configuré (optionnel)
 * @returns {Promise<CameraDriver>}
 */
export async function createCameraAdapter(driverOverride = null) {
    const configDriver = driverOverride || getCameraConfig();
    const resolvedDriver = resolveDriverForPlatform(configDriver);
    
    console.log(`[CAMERA] Configuration: ${configDriver}`);
    console.log(`[CAMERA] Resolved driver: ${getDriverDisplayName(resolvedDriver)}`);
    
    try {
        const camera = await loadDriver(resolvedDriver);
        
        // Test rapide pour vérifier que le driver fonctionne
        console.log('[CAMERA] Testing driver...');
        await camera.list();
        
        console.log(`[CAMERA] ✓ Driver loaded successfully: ${getDriverDisplayName(resolvedDriver)}`);
        return camera;
        
    } catch (error) {
        console.error(`[CAMERA] ✗ Failed to load ${getDriverDisplayName(resolvedDriver)}:`, error.message);
        
        // Fallback uniquement si mode AUTO
        if (configDriver === CAMERA_DRIVERS.AUTO) {
            console.log('[CAMERA] Attempting fallback...');
            return await loadFallbackDriver(resolvedDriver);
        } else {
            // Mode explicite : ne pas faire de fallback
            console.error('[CAMERA] No fallback attempted (explicit driver configuration)');
            throw error;
        }
    }
}

/**
 * Charge le driver spécifié
 * @param {string} driver - Le driver à charger
 * @returns {Promise<CameraDriver>}
 */
async function loadDriver(driver) {
    switch (driver) {
        case CAMERA_DRIVERS.WEBCAM:
            return await loadWebcamDriver();
            
        case CAMERA_DRIVERS.GPHOTO2:
            return await loadGPhoto2Driver();
            
        case CAMERA_DRIVERS.GPHOTO2_LEGACY:
            return await loadGPhoto2LegacyDriver();
            
        default:
            throw new Error(`[CAMERA] Unknown driver: ${driver}`);
    }
}

/**
 * Charge le driver Webcam
 * @returns {Promise<WebcamCamera>}
 */
async function loadWebcamDriver() {
    console.log('[CAMERA] Loading Webcam driver...');
    const { WebcamCamera } = await import('./cameras/WebcamCamera.js');
    return new WebcamCamera();
}

/**
 * Charge le driver GPhoto2 moderne
 * @returns {Promise<GPhoto2Camera>}
 */
async function loadGPhoto2Driver() {
    console.log('[CAMERA] Loading GPhoto2 driver (@photobot/gphoto2-camera)...');
    const { GPhoto2Camera } = await import('./cameras/GPhoto2Camera.js');
    return new GPhoto2Camera();
}

/**
 * Charge le driver GPhoto2 Legacy (deprecated)
 * @returns {Promise<GPhoto2LegacyCamera>}
 */
async function loadGPhoto2LegacyDriver() {
    console.log('[CAMERA] Loading GPhoto2 Legacy driver...');
    console.warn('[CAMERA] ⚠️  This driver is deprecated and unmaintained since 2022');
    const { GPhoto2LegacyCamera } = await import('./cameras/GPhoto2LegacyCamera.js');
    return new GPhoto2LegacyCamera();
}

/**
 * Gère le fallback intelligent en cas d'échec du driver
 * @param {string} failedDriver - Le driver qui a échoué
 * @returns {Promise<CameraDriver>}
 */
async function loadFallbackDriver(failedDriver) {
    const platform = process.platform;
    
    if (platform === 'win32') {
        // Sur Windows, toujours fallback sur webcam
        console.log('[CAMERA] Fallback: → webcam');
        return await loadWebcamDriver();
        
    } else {
        // Sur Linux, fallback hierarchy: gphoto2 → gphoto2-legacy → webcam
        if (failedDriver === CAMERA_DRIVERS.GPHOTO2) {
            try {
                console.log('[CAMERA] Fallback: gphoto2 → gphoto2-legacy');
                return await loadGPhoto2LegacyDriver();
            } catch (error) {
                console.error('[CAMERA] Legacy driver also failed:', error.message);
                console.log('[CAMERA] Fallback: gphoto2-legacy → webcam');
                return await loadWebcamDriver();
            }
            
        } else if (failedDriver === CAMERA_DRIVERS.GPHOTO2_LEGACY) {
            console.log('[CAMERA] Fallback: gphoto2-legacy → webcam');
            return await loadWebcamDriver();
        }
    }
    
    throw new Error('[CAMERA] All camera drivers failed');
}
