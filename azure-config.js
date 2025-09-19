/**
 * Configuration Azure
 * Ajustez ces paramètres selon votre déploiement Azure
 */

module.exports = {
    // URL de l'Azure App Service (à modifier après déploiement)
    azureUrl: process.env.AZURE_STREAMER_URL || 'https://your-app.azurewebsites.net',
    
    // Secret partagé pour l'authentification (même que dans Azure)
    sharedSecret: process.env.SHARED_SECRET || 'your-shared-secret-here',
    
    // ID unique de ce RPI (peut être généré automatiquement)
    rpiId: process.env.RPI_ID || 'rpi-001',
    
    // Répertoire des photos
    picturesDir: __dirname + '/public/pictures/',
    
    // Activer/désactiver la connexion Azure
    enabled: process.env.AZURE_ENABLED === 'true'
};