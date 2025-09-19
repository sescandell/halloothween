# Instructions de Déploiement - PhotoboothStreamer

## 1. Prérequis

Assurez-vous d'avoir installé :
- Azure CLI : `az --version`
- Azure Developer CLI : `azd version`

Si azd n'est pas installé :
```powershell
Invoke-RestMethod 'https://aka.ms/install-azd.ps1' | Invoke-Expression
```

## 2. Configuration

1. Naviguez vers le dossier PhotoboothStreamer
```bash
cd PhotoboothStreamer
```

2. Initialisez azd (si pas déjà fait)
```bash
azd init
```

3. Configurez les variables d'environnement
```bash
azd env set SHARED_SECRET "votre-secret-securise-ici"
azd env set PORT "3000"
```

**Note** : Infrastructure simplifiée avec seulement App Service + App Service Plan (pas de Key Vault, Application Insights, ou identité managée).

## 3. Déploiement

```bash
# Authentification Azure
azd auth login

# Déploiement complet
azd up
```

## 4. Configuration RPI

Une fois le déploiement Azure terminé :

1. Notez l'URL de votre App Service (affichée après `azd up`)
2. Créez un fichier `.env` dans le dossier principal du photobooth :

```env
AZURE_STREAMER_URL=https://votre-app.azurewebsites.net
SHARED_SECRET=votre-secret-securise-ici
RPI_ID=rpi-photobooth-001
AZURE_ENABLED=true
```

3. Installez les nouvelles dépendances sur le RPI :
```bash
npm install
```

4. Redémarrez le service photobooth

## 5. Test

1. Prenez une photo avec le photobooth
2. Cliquez sur la miniature - vous devriez voir l'image avec le QR code
3. Scannez le QR code avec un téléphone
4. L'image devrait se télécharger via Azure

## Architecture

```
RPI Photobooth ←→ Socket.IO Local (port 8181)
       ↓
   Socket.IO Azure ←→ Azure App Service ←→ Scan QR utilisateur
```

## Dépannage

- Vérifiez que le RPI est connecté à Azure : logs dans la console
- Vérifiez l'URL Azure dans les variables d'environnement
- Vérifiez que le SHARED_SECRET est identique sur RPI et Azure