#!/usr/bin/env node

/**
 * Script post-install qui installe les dépendances de caméra appropriées
 * selon la plateforme détectée
 * 
 * - Windows : installe node-webcam
 * - Linux/Unix : installe gphoto2
 */

const { execSync } = require('child_process');
const platform = process.platform;

console.log('\n[CAMERA SETUP] Détection de la plateforme : ' + platform);

try {
    if (platform === 'win32') {
        // Windows : installer node-webcam
        console.log('[CAMERA SETUP] Installation de node-webcam pour Windows...');
        execSync('npm install node-webcam@^0.8.1', { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        console.log('[CAMERA SETUP] ✓ node-webcam installé avec succès');
        
    } else {
        // Linux/Unix : installer gphoto2
        console.log('[CAMERA SETUP] Installation de gphoto2 pour Linux/Unix...');
        console.log('[CAMERA SETUP] Note: Assurez-vous que libgphoto2-dev est installé (apt install libgphoto2-dev)');
        
        try {
            execSync('npm install gphoto2@^0.3.2', { 
                stdio: 'inherit',
                cwd: __dirname 
            });
            console.log('[CAMERA SETUP] ✓ gphoto2 installé avec succès');
        } catch (error) {
            console.warn('[CAMERA SETUP] ⚠ Erreur lors de l\'installation de gphoto2');
            console.warn('[CAMERA SETUP] Vérifiez que libgphoto2-dev est installé :');
            console.warn('[CAMERA SETUP]   sudo apt install libgphoto2-dev');
        }
    }
    
    console.log('[CAMERA SETUP] Configuration terminée\n');
    
} catch (error) {
    console.error('[CAMERA SETUP] Erreur lors de l\'installation:', error.message);
    console.log('[CAMERA SETUP] Vous pouvez ignorer cette erreur et installer manuellement si nécessaire\n');
    // Ne pas faire échouer l'installation complète
    process.exit(0);
}
