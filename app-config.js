/**
 * Configuration Azure
 * Ajustez ces paramètres selon votre déploiement Azure
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    // ID unique de ce RPI (peut être généré automatiquement)
    rpiId: process.env.RPI_ID || 'rpi-001',
    // Répertoire des photos
    picturesDir: __dirname + '/public/pictures/',
    // Configuration du streamer
    streamer: {
        // Activer ou désactiver le streamer
        enabled: process.env.STREAMER_ENABLED !== 'false',
        // URL du service de streaming
        url: process.env.STREAMER_URL || 'https://az-pbs-app-tsssv4bwknape.azurewebsites.net',
        // Secret partagé pour l'authentification
        sharedSecret: process.env.STREAMER_SHARED_SECRET || '',
    }
};
