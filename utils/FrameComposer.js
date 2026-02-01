/**
 * Frame Composer
 * Compose photos avec un cadre PNG overlay pour l'impression
 * Format cible : 10x15 cm (1844x1240 pixels @ 300 DPI)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export class FrameComposer {
    constructor(config) {
        this.enabled = config.enabled;
        this.framePath = config.framePath;
        this.frameBuffer = null;
        this.frameMetadata = null;
        this.available = false;
        
        // Dimensions cibles pour impression 10x15 cm @ 300 DPI
        this.TARGET_WIDTH = 1844;
        this.TARGET_HEIGHT = 1240;
        
        console.log(`[FRAME] Initializing FrameComposer...`);
    }

    /**
     * Initialize and validate frame PNG
     */
    async initialize() {
        if (!this.enabled) {
            console.log('[FRAME] Frame overlay disabled in configuration');
            return;
        }

        if (!this.framePath) {
            console.log('[FRAME] ⚠️  No frame path configured (PRINT_FRAME_PATH empty)');
            console.log('[FRAME] → Printing will continue WITHOUT frame overlay');
            this.available = false;
            return;
        }

        try {
            // Résoudre le chemin absolu
            const absolutePath = path.resolve(process.cwd(), this.framePath);
            
            // Vérifier que le fichier existe
            if (!fs.existsSync(absolutePath)) {
                throw new Error(`Frame file not found: ${absolutePath}`);
            }

            console.log(`[FRAME] Loading frame from: ${this.framePath}`);

            // Charger et valider le PNG
            this.frameBuffer = fs.readFileSync(absolutePath);
            this.frameMetadata = await sharp(this.frameBuffer).metadata();

            // Vérifier le format
            if (this.frameMetadata.format !== 'png') {
                throw new Error(`Frame must be PNG format (got ${this.frameMetadata.format})`);
            }

            // Vérifier les dimensions
            if (this.frameMetadata.width !== this.TARGET_WIDTH || 
                this.frameMetadata.height !== this.TARGET_HEIGHT) {
                console.log(`[FRAME] ⚠️  Frame dimensions mismatch:`);
                console.log(`[FRAME]    Expected: ${this.TARGET_WIDTH}x${this.TARGET_HEIGHT}px`);
                console.log(`[FRAME]    Got: ${this.frameMetadata.width}x${this.frameMetadata.height}px`);
                console.log(`[FRAME]    Frame will be resized (may affect quality)`);
            }

            // Vérifier la présence d'un canal alpha (transparence)
            if (!this.frameMetadata.hasAlpha) {
                console.log(`[FRAME] ⚠️  Frame PNG has no transparency channel`);
                console.log(`[FRAME]    This may cover the entire photo`);
            }

            this.available = true;
            console.log(`[FRAME] ✓ Frame loaded successfully: ${path.basename(this.framePath)}`);
            console.log(`[FRAME] ✓ Dimensions: ${this.frameMetadata.width}x${this.frameMetadata.height}px`);
            console.log(`[FRAME] ✓ Has transparency: ${this.frameMetadata.hasAlpha ? 'Yes' : 'No'}`);
            console.log(`[FRAME] ✓ Ready to compose photos`);

        } catch (error) {
            console.error(`[FRAME] ✗ Failed to load frame:`, error.message);
            console.log(`[FRAME] → Printing will continue WITHOUT frame overlay`);
            this.available = false;
        }
    }

    /**
     * Compose photo with frame overlay
     * @param {string} photoPath - Path to original photo
     * @returns {Promise<string>} - Path to composed photo
     */
    async composeForPrint(photoPath) {
        if (!this.isAvailable()) {
            console.log('[FRAME] Frame composer not available, returning original photo');
            return photoPath;
        }

        if (!fs.existsSync(photoPath)) {
            throw new Error(`Photo file not found: ${photoPath}`);
        }

        const photoName = path.basename(photoPath);
        console.log(`[FRAME] Composing ${photoName} with frame...`);

        try {
            // Étape 1 : Redimensionner la photo en 1844x1240 (cover)
            console.log(`[FRAME]    → Resizing photo to ${this.TARGET_WIDTH}x${this.TARGET_HEIGHT}px (cover mode)`);
            const resizedPhotoBuffer = await sharp(photoPath)
                .resize(this.TARGET_WIDTH, this.TARGET_HEIGHT, {
                    fit: 'cover',              // Remplit tout l'espace
                    position: 'center',        // Centre l'image
                    withoutEnlargement: false  // Permet l'agrandissement
                })
                .toBuffer();

            // Étape 2 : Préparer le cadre (redimensionner si nécessaire)
            let frameBuffer = this.frameBuffer;
            if (this.frameMetadata.width !== this.TARGET_WIDTH || 
                this.frameMetadata.height !== this.TARGET_HEIGHT) {
                console.log(`[FRAME]    → Resizing frame to match target dimensions`);
                frameBuffer = await sharp(this.frameBuffer)
                    .resize(this.TARGET_WIDTH, this.TARGET_HEIGHT, {
                        fit: 'fill'  // Force les dimensions exactes
                    })
                    .toBuffer();
            }

            // Étape 3 : Composer photo + cadre
            const framedDir = path.join(process.cwd(), 'public', 'print-framed');
            if (!fs.existsSync(framedDir)) {
                fs.mkdirSync(framedDir, { recursive: true });
                console.log('[FRAME] Created /public/print-framed/ directory');
            }

            const timestamp = Date.now();
            // Force PNG extension
            const parsedPath = path.parse(photoName);
            const framedName = `framed_${timestamp}_${parsedPath.name}.png`;
            const framedPath = path.join(framedDir, framedName);

            console.log(`[FRAME]    → Compositing frame overlay`);
            await sharp(resizedPhotoBuffer)
                .composite([{
                    input: frameBuffer,
                    top: 0,
                    left: 0
                }])
                .png()
                .toFile(framedPath);

            console.log(`[FRAME] ✓ Composed photo saved: /public/print-framed/${framedName}`);
            console.log(`[FRAME] ✓ Ready for printing`);
            return framedPath;

        } catch (error) {
            console.error('[FRAME] ✗ Composition failed:', error.message);
            throw error;
        }
    }

    /**
     * Check if frame composer is available
     */
    isAvailable() {
        return this.enabled && this.available;
    }

    /**
     * Get frame status information
     */
    getStatus() {
        return {
            enabled: this.enabled,
            available: this.available,
            framePath: this.framePath,
            dimensions: this.frameMetadata ? {
                width: this.frameMetadata.width,
                height: this.frameMetadata.height,
                format: this.frameMetadata.format,
                hasAlpha: this.frameMetadata.hasAlpha
            } : null,
            targetDimensions: {
                width: this.TARGET_WIDTH,
                height: this.TARGET_HEIGHT,
                format: '10x15 cm @ 300 DPI'
            }
        };
    }
}
