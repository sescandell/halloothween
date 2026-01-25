/**
 * Configuration Azure
 * Ajustez ces paramètres selon votre déploiement Azure
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    // URL de l'Azure App Service (à modifier après déploiement)
    azureUrl: process.env.AZURE_STREAMER_URL || 'https://az-pbs-app-tsssv4bwknape.azurewebsites.net',
    
    // Secret partagé pour l'authentification (même que dans Azure)
    sharedSecret: process.env.SHARED_SECRET || 'yoursecret',
    
    // ID unique de ce RPI (peut être généré automatiquement)
    rpiId: process.env.RPI_ID || 'rpi-001',
    
    // Répertoire des photos
    picturesDir: __dirname + '/public/pictures/',
    
    // Activer/désactiver la connexion Azure
    enabled: process.env.AZURE_ENABLED !== 'false'
};
