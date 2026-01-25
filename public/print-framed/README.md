# Photos composées avec cadre

Ce dossier contient les photos finales composées (photo + cadre) avant impression.

## Format des fichiers

Les fichiers sont automatiquement générés lors de l'impression avec le format :

```
framed_[timestamp]_[photo-originale].jpg
```

**Exemple** : `framed_1769380000000_1769377129854.jpg`

### Caractéristiques
- **Format** : JPEG qualité 100%
- **Dimensions** : 1844x1240 pixels (10x15 cm @ 300 DPI)
- **Composition** : Photo originale redimensionnée + cadre PNG superposé

## Processus de création

1. Photo originale capturée (ex: 640x480px)
2. Redimensionnement en 1844x1240px (mode "cover", centré)
3. Superposition du cadre PNG configuré
4. Sauvegarde dans ce dossier
5. Impression de la version composée

## Conservation des fichiers

Ces fichiers sont **conservés** pour :
- ✅ Historique des impressions
- ✅ Vérification du rendu avant impression réelle
- ✅ Debug en cas de problème
- ✅ Archivage des événements

Les fichiers ne sont **pas automatiquement supprimés** après impression.

## Nettoyage

Vous pouvez supprimer manuellement les anciens fichiers si nécessaire :

```bash
# Supprimer tous les fichiers composés
rm public/print-framed/framed_*.jpg

# Supprimer les fichiers de plus de 30 jours (Linux/macOS)
find public/print-framed -name "framed_*.jpg" -mtime +30 -delete
```

## Désactivation

Pour désactiver la composition avec cadre :

```bash
# Dans .env
PRINT_FRAME_ENABLED=false
```

Les photos seront alors imprimées sans cadre et ce dossier ne sera pas utilisé.
