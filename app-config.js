/**
 * Configuration de l'application
 * Ajustez ces paramètres selon votre déploiement
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getCameraConfig } from './utils/camera-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    // ID unique de ce RPI (peut être généré automatiquement)
    rpiId: process.env.RPI_ID || 'rpi-001',
    
    // Répertoire des photos
    picturesDir: __dirname + '/public/pictures/',
    
    // Configuration de la caméra
    camera: {
        // Driver à utiliser (auto, webcam, gphoto2, gphoto2-legacy)
        driver: getCameraConfig(),
        // Mode pause du stream avant capture
        pauseStreamOnCapture: process.env.PAUSE_STREAM_ON_CAPTURE === 'true'
    },
    
    // Configuration du streamer
    streamer: {
        // Activer ou désactiver le streamer
        enabled: process.env.STREAMER_ENABLED !== 'false',
        // URL du service de streaming
        url: process.env.STREAMER_URL || 'https://az-pbs-app-tsssv4bwknape.azurewebsites.net',
        // Secret partagé pour l'authentification
        sharedSecret: process.env.STREAMER_SHARED_SECRET || '',
    },
    
    // Configuration de l'imprimante
    printer: {
        // Activer ou désactiver l'impression
        enabled: process.env.PRINTER_ENABLED === 'true',
        // Nom de l'imprimante (tel qu'affiché par le système)
        name: process.env.PRINTER_NAME || 'DNP QW410',
        // Mode d'impression (auto, manual)
        mode: process.env.PRINTER_MODE || 'auto'
    }
};
