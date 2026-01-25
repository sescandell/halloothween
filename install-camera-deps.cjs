#!/usr/bin/env node

/**
 * Script post-install qui installe les dépendances de caméra appropriées
 * selon la plateforme détectée
 * 
 * - Windows : installe node-webcam
 * - Linux/Unix : installe @photobot/gphoto2-camera (modern), puis gphoto2 (legacy) en fallback, puis node-webcam
 */

const { execSync } = require('child_process');
const platform = process.platform;

console.log('\n[CAMERA SETUP] Détection de la plateforme : ' + platform);

/**
 * Fonction helper pour installer un package npm
 * @param {string} packageName - Nom du package à installer
 * @param {string} version - Version du package
 * @returns {boolean} - true si l'installation a réussi, false sinon
 */
function installPackage(packageName, version) {
    try {
        console.log(`[CAMERA SETUP] Installation de ${packageName}@${version}...`);
        execSync(`npm install ${packageName}@${version}`, { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        console.log(`[CAMERA SETUP] ✓ ${packageName} installé avec succès`);
        return true;
    } catch (error) {
        console.warn(`[CAMERA SETUP] ⚠ Erreur lors de l'installation de ${packageName}`);
        return false;
    }
}

try {
    if (platform === 'win32') {
        // Windows : installer node-webcam uniquement
        console.log('[CAMERA SETUP] Plateforme Windows détectée');
        installPackage('node-webcam', '^0.8.1');
        
    } else {
        // Linux/Unix : installer les drivers gphoto2 avec fallback
        console.log('[CAMERA SETUP] Plateforme Linux/Unix détectée');
        console.log('[CAMERA SETUP] Note: Pour gphoto2, assurez-vous que libgphoto2 est installé :');
        console.log('[CAMERA SETUP]   sudo apt install libgphoto2-dev libgphoto2-6');
        console.log('');
        
        let modernInstalled = false;
        let legacyInstalled = false;
        
        // Tentative 1 : @photobot/gphoto2-camera (modern, FFI-based, no compilation)
        console.log('[CAMERA SETUP] Tentative d\'installation du driver moderne (@photobot/gphoto2-camera)...');
        modernInstalled = installPackage('@photobot/gphoto2-camera', '^2.8.0');
        
        if (modernInstalled) {
            console.log('[CAMERA SETUP] ✓ Driver moderne installé - recommandé pour utilisation');
        } else {
            console.warn('[CAMERA SETUP] ⚠ Driver moderne non disponible');
        }
        
        // Tentative 2 : gphoto2 (legacy, requires native compilation)
        console.log('[CAMERA SETUP] Installation du driver legacy (gphoto2) comme fallback...');
        legacyInstalled = installPackage('gphoto2', '^0.3.2');
        
        if (legacyInstalled) {
            console.log('[CAMERA SETUP] ✓ Driver legacy installé');
        } else {
            console.warn('[CAMERA SETUP] ⚠ Driver legacy non disponible');
        }
        
        // Tentative 3 : node-webcam comme dernier fallback
        console.log('[CAMERA SETUP] Installation de node-webcam comme fallback final...');
        const webcamInstalled = installPackage('node-webcam', '^0.8.1');
        
        // Résumé
        console.log('');
        console.log('[CAMERA SETUP] === Résumé des drivers installés ===');
        console.log(`[CAMERA SETUP] Driver moderne (@photobot/gphoto2-camera): ${modernInstalled ? '✓ OUI' : '✗ NON'}`);
        console.log(`[CAMERA SETUP] Driver legacy (gphoto2): ${legacyInstalled ? '✓ OUI' : '✗ NON'}`);
        console.log(`[CAMERA SETUP] Driver webcam (node-webcam): ${webcamInstalled ? '✓ OUI' : '✗ NON'}`);
        
        if (!modernInstalled && !legacyInstalled && !webcamInstalled) {
            console.warn('[CAMERA SETUP] ⚠ ATTENTION : Aucun driver de caméra n\'a pu être installé');
            console.warn('[CAMERA SETUP] L\'application pourrait ne pas fonctionner correctement');
        } else if (modernInstalled) {
            console.log('[CAMERA SETUP] Recommandation : Utilisez CAMERA_DRIVER=gphoto2 ou CAMERA_DRIVER=auto');
        } else if (legacyInstalled) {
            console.log('[CAMERA SETUP] Recommandation : Utilisez CAMERA_DRIVER=gphoto2-legacy');
        }
    }
    
    console.log('[CAMERA SETUP] Configuration terminée\n');
    
} catch (error) {
    console.error('[CAMERA SETUP] Erreur lors de l\'installation:', error.message);
    console.log('[CAMERA SETUP] Vous pouvez ignorer cette erreur et installer manuellement si nécessaire\n');
    // Ne pas faire échouer l'installation complète
    process.exit(0);
}
