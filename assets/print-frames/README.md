# Cadres d'impression / Print Frames

Ce dossier contient les cadres PNG à superposer sur les photos avant impression.

## Spécifications techniques

### Dimensions requises
- **Largeur** : 1844 pixels
- **Hauteur** : 1240 pixels
- **Résolution** : 300 DPI
- **Format physique** : 10x15 cm (4x6 pouces)

### Format du fichier
- **Type** : PNG avec canal alpha (transparence)
- **Poids** : 500 KB - 2 MB selon la complexité
- **Orientation** : Paysage (landscape)

## Structure recommandée

```
┌─────────────────────────────────────────┐
│                                         │ ↕️ 1040px (~84%)
│                                         │   ZONE TRANSPARENTE
│         [PHOTO VISIBLE ICI]             │   (alpha = 0)
│                                         │   
│                                         │
├─────────────────────────────────────────┤
│  Votre texte/logo/décorations           │ ↕️ 200px (~16%)
│  Ex: "45 ans Jean-Claude"               │   ZONE OPAQUE
└─────────────────────────────────────────┘   Cadre personnalisé
          1844 pixels (largeur)
```

## Conseils de création

### ✅ À FAIRE
- ✅ Zone photo **complètement transparente** (partie haute ~1040px)
- ✅ Texte **lisible** avec bon contraste (min 48pt)
- ✅ Marges internes suffisantes (15-20px)
- ✅ Tester sur fond clair ET foncé

### ❌ À ÉVITER
- ❌ Texte trop petit (illisible sur format 10x15)
- ❌ Trop de détails (perte de qualité)
- ❌ Couleurs trop pâles
- ❌ Format JPEG (pas de transparence)

## Utilisation

1. Créer votre PNG aux dimensions exactes
2. Le placer dans ce dossier
3. Configurer dans `.env` :
   ```bash
   PRINT_FRAME_ENABLED=true
   PRINT_FRAME_PATH=assets/print-frames/votre-cadre.png
   ```
4. Redémarrer l'application

## Exemples fournis

- `example-frame.png` : Template de démonstration avec zones marquées

## Outils recommandés

- **Photoshop/GIMP** : Contrôle total, export PNG avec transparence
- **Canva** : Interface simple (créer un design 1844x1240px)
- **Figma** : Design vectoriel, export PNG haute qualité

## Comportement

### Si le cadre est activé et valide
- La photo originale est redimensionnée en 1844x1240px (mode "cover")
- Le cadre PNG est superposé par-dessus
- La photo composée est sauvegardée dans `/public/print-framed/`
- L'impression utilise la version avec cadre

### Si le fichier n'existe pas ou est invalide
- Un warning est loggé au démarrage
- L'impression continue sans cadre
- Pas d'erreur bloquante

## Format de sortie

Les photos composées sont sauvegardées dans `/public/print-framed/` avec le format :
```
framed_[timestamp]_[photo-originale].jpg
```

Exemple : `framed_1769380000000_1769377129854.jpg`
