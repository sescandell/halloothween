# PhotoboothStreamer - Azure Service

Service Azure minimal de streaming d'images pour photobooth avec authentification par QR code.

## Architecture

- **Azure App Service Basic** : Héberge le serveur Node.js/Socket.IO
- **Socket.IO** : Communication temps réel entre RPI et Azure
- **Streaming** : Images transmises à la demande uniquement (pas de stockage)
- **Configuration simple** : Variables d'environnement directement dans l'App Service

## Configuration

### Variables d'environnement
- `SHARED_SECRET` : Token partagé pour l'authentification RPI (stocké dans App Service)
- `PORT` : Port d'écoute (3000 par défaut)

### Endpoints

- `GET /` : Status du service
- `GET /health` : Vérification santé
- `GET /stream/{photoId}?rpi={rpiId}` : Streaming d'image

## Flux de fonctionnement

1. **RPI se connecte** : `socket.emit('register-rpi', {rpiId})`
2. **Scan QR code** : GET `/stream/photo123`
3. **Azure demande** : `socket.emit('request-photo', {requestId, photoId})`
4. **RPI répond** : `socket.emit('photo-data', {requestId, photoData})`
5. **Azure stream** : Image directement vers l'utilisateur

## Authentification

Le RPI doit s'authentifier avec le `SHARED_SECRET` :
```javascript
const socket = io('https://yourapp.azurewebsites.net', {
  auth: { token: 'votre-secret-partage' }
});
```

## Déploiement

```bash
# Initialiser l'environnement Azure
azd init

# Définir les variables
azd env set SHARED_SECRET "votre-secret-securise"
azd env set PORT "3000"

# Déployer
azd up
```