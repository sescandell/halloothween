# Print Folder - Mode Simulation

Ce dossier stocke les "impressions simulées" lorsque l'imprimante est configurée en mode `__SIMULATION__`.

## Fonctionnement

Lorsque `PRINTER_NAME=__SIMULATION__` dans le fichier `.env`, chaque demande d'impression :

1. Copie la photo originale dans ce dossier
2. Ajoute un préfixe avec timestamp : `print_[timestamp]_[original_name].jpg`
3. Simule un délai d'impression (1 seconde)
4. Confirme le succès à l'utilisateur

## Utilité

- **Tests** : Valider l'interface et le workflow d'impression sans imprimante physique
- **Développement** : Vérifier que les bonnes photos sont envoyées à l'impression
- **Démonstration** : Montrer la fonctionnalité avant d'avoir la DNP QW410

## Format des fichiers

```
print_1769377552011_1769377129854.jpg
      ^               ^
      |               └─ Nom du fichier original
      └─ Timestamp de l'impression simulée
```

## Configuration

Dans `.env` :
```bash
PRINTER_ENABLED=true
PRINTER_NAME=__SIMULATION__
PRINTER_MODE=auto
```

## En production

Avec la vraie imprimante DNP QW410, changez simplement :
```bash
PRINTER_NAME=DNP QW410
```

Ce dossier ne sera alors plus utilisé.
