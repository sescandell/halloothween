/**
 * Printer Client
 * Gère l'impression des photos sur imprimante DNP QW410
 * Support : Raspberry Pi/Linux (CUPS) - Mode SIMULATION sur Windows
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { FrameComposer } from './FrameComposer.js';

const execAsync = promisify(exec);

export class PrinterClient {
    constructor(config) {
        this.enabled = config.enabled;
        this.printerName = config.name;
        this.mode = config.mode;
        this.frameConfig = config.frameConfig || null;
        this.platform = process.platform;
        this.available = false;
        this.simulationMode = false;
        this.detectedPrinters = [];
        this.frameComposer = null;
        
        console.log(`[PRINTER] Initializing PrinterClient on ${this.platform}...`);
    }

    /**
     * Initialize printer client and detect available printers
     */
    async initialize() {
        if (!this.enabled) {
            console.log('[PRINTER] Printing is disabled in configuration');
            return;
        }

        // Initialize Frame Composer (works on all platforms)
        if (this.frameConfig && this.frameConfig.enabled) {
            console.log('[PRINTER] Initializing Frame Composer...');
            this.frameComposer = new FrameComposer(this.frameConfig);
            await this.frameComposer.initialize();
        }

        // Force SIMULATION mode on Windows (no real printer support)
        if (this.platform === 'win32') {
            this.simulationMode = true;
            this.available = true;
            console.log('[PRINTER] ⚠️  Windows detected: SIMULATION MODE (saves to /print folder)');
            console.log('[PRINTER]    Real printing is only available on Raspberry Pi/Linux with DNP QW410');
            return;
        }

        // Check for explicit simulation mode on Linux
        if (this.printerName === '__SIMULATION__') {
            this.simulationMode = true;
            this.available = true;
            console.log('[PRINTER] ⚠️  SIMULATION MODE - No actual printing will occur');
            return;
        }

        // Linux/RPI: Detect printers via CUPS
        await this._detectPrintersLinux();

        // Check if configured printer is available
        if (this.detectedPrinters.length === 0) {
            console.log('[PRINTER] ⚠️  No printers detected (is CUPS installed?)');
            this.available = false;
            return;
        }

        const foundPrinter = this.detectedPrinters.find(p => 
            p.name === this.printerName || 
            p.name.toLowerCase().includes(this.printerName.toLowerCase())
        );

        if (foundPrinter) {
            this.available = true;
            console.log(`[PRINTER] ✓ Printer found: "${foundPrinter.name}"`);
            console.log(`[PRINTER] ✓ Ready to print via CUPS`);
        } else {
            this.available = false;
            console.log(`[PRINTER] ⚠️  Configured printer "${this.printerName}" not found`);
            console.log(`[PRINTER]    Available printers:`, this.detectedPrinters.map(p => p.name).join(', '));
        }
    }

    /**
     * Detect printers on Linux using lpstat (CUPS)
     */
    async _detectPrintersLinux() {
        try {
            const { stdout } = await execAsync('lpstat -p');
            const lines = stdout.trim().split('\n');
            const printers = lines.map(line => {
                // Format: "printer PrinterName is idle..."
                const match = line.match(/^printer\s+(\S+)/);
                return match ? { name: match[1], isDefault: false } : null;
            }).filter(p => p !== null);
            
            this.detectedPrinters = printers;
            console.log(`[PRINTER] Found ${printers.length} printer(s) via CUPS`);
        } catch (error) {
            console.error('[PRINTER] Failed to detect printers (is CUPS installed?):', error.message);
            this.detectedPrinters = [];
        }
    }

    /**
     * Print a photo
     * @param {string} photoPath - Absolute path to the photo file
     */
    async printPhoto(photoPath) {
        if (!this.isAvailable()) {
            throw new Error('Printer not available');
        }

        // Check if file exists
        if (!fs.existsSync(photoPath)) {
            throw new Error(`Photo file not found: ${photoPath}`);
        }

        // STEP 1: Compose with frame if enabled
        let finalPhotoPath = photoPath;
        if (this.frameComposer && this.frameComposer.isAvailable()) {
            try {
                console.log(`[PRINTER] Composing photo with frame overlay...`);
                finalPhotoPath = await this.frameComposer.composeForPrint(photoPath);
                console.log(`[PRINTER] ✓ Using framed version for printing`);
            } catch (error) {
                console.error('[PRINTER] ⚠️  Frame composition failed:', error.message);
                console.log('[PRINTER] → Falling back to original photo');
                // Continue with original photo (finalPhotoPath stays unchanged)
            }
        }

        console.log(`[PRINTER] Printing: ${path.basename(finalPhotoPath)} to "${this.printerName}"`);

        // STEP 2: Simulation mode - save a copy to /print folder
        if (this.simulationMode) {
            console.log(`[PRINTER] 🖨️  SIMULATION: Would print ${path.basename(finalPhotoPath)}`);
            
            try {
                // Create print directory if it doesn't exist
                const printDir = path.join(path.dirname(photoPath), '../print');
                if (!fs.existsSync(printDir)) {
                    fs.mkdirSync(printDir, { recursive: true });
                    console.log('[PRINTER] Created /print directory');
                }
                
                // Copy the photo to the print folder with timestamp prefix
                const timestamp = Date.now();
                const originalName = path.basename(finalPhotoPath);
                const printFileName = `print_${timestamp}_${originalName}`;
                const printPath = path.join(printDir, printFileName);
                
                fs.copyFileSync(finalPhotoPath, printPath);
                console.log(`[PRINTER] ✓ SIMULATION: Saved print preview to /print/${printFileName}`);
                
                // Simulate printing delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('[PRINTER] ✓ SIMULATION: Print job completed');
            } catch (error) {
                console.error('[PRINTER] ⚠️  SIMULATION: Failed to save print preview:', error.message);
                // Don't throw error in simulation mode, just log it
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('[PRINTER] ✓ SIMULATION: Print job completed (without preview save)');
            }
            
            return;
        }

        // STEP 3: Actual printing via CUPS (Linux/RPI only)
        try {
            await this._printViaCUPS(finalPhotoPath);
            console.log('[PRINTER] ✓ Print job sent successfully');
        } catch (error) {
            console.error('[PRINTER] ✗ Print job failed:', error.message);
            throw error;
        }
    }

    /**
     * Print on Linux using lp command (CUPS)
     */
    async _printViaCUPS(photoPath) {
        const command = `lp -d "${this.printerName}" "${photoPath}"`;
        
        try {
            const { stdout, stderr } = await execAsync(command);
            if (stderr && !stderr.includes('request id')) {
                throw new Error(stderr);
            }
            console.log('[PRINTER] Print command executed via CUPS:', stdout.trim());
        } catch (error) {
            throw new Error(`CUPS command failed: ${error.message}`);
        }
    }

    /**
     * Check if printer is available
     */
    isAvailable() {
        return this.enabled && this.available;
    }

    /**
     * Get printer status information
     */
    getStatus() {
        return {
            enabled: this.enabled,
            available: this.available,
            simulationMode: this.simulationMode,
            printerName: this.printerName,
            platform: this.platform,
            detectedPrinters: this.detectedPrinters,
            method: this.simulationMode ? 'simulation' : 'CUPS'
        };
    }
}
