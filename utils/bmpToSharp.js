/**
 * BMP to Sharp conversion utility
 * Handles BMP format detection and conversion to Sharp instances
 * Uses bmp-ts for BMP decoding (Sharp doesn't support BMP natively)
 */

import { decode as decodeBmp } from 'bmp-ts';
import sharp from 'sharp';

/**
 * Detects if a buffer contains a BMP image
 * @param {Buffer} buffer - Image buffer to check
 * @returns {boolean} - true if BMP format (signature 0x42 0x4D = "BM")
 */
export function isBMP(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 2) {
        return false;
    }
    // BMP signature: 'BM' = 0x42 0x4D
    return buffer[0] === 0x42 && buffer[1] === 0x4D;
}

/**
 * Creates a Sharp instance from a BMP buffer
 * @param {Buffer} bmpBuffer - BMP image buffer
 * @returns {Sharp} - Sharp instance ready for processing
 */
export function sharpFromBMP(bmpBuffer) {
    // Decode BMP with toRGBA option for correct channel order
    // IMPORTANT: toRGBA: true converts ALL BMP formats (24-bit, 32-bit, etc.)
    // to RGBA format, which ALWAYS results in 4 channels
    const decoded = decodeBmp(bmpBuffer, { toRGBA: true });
    
    // BUG FIX: bmp-ts sets alpha channel to 0 for 24-bit BMP
    // This causes transparent pixels which appear black in JPEG conversion
    // Solution: Set all alpha values to 255 (fully opaque) for 24-bit BMP
    if (decoded.bitPP === 24) {
        for (let i = 3; i < decoded.data.length; i += 4) {
            decoded.data[i] = 255;
        }
    }
    
    // Create Sharp instance from raw pixel data
    // Always 4 channels (RGBA) when using toRGBA: true
    return sharp(decoded.data, {
        raw: {
            width: decoded.width,
            height: decoded.height,
            channels: 4
        }
    });
}

/**
 * Smart Sharp constructor with automatic BMP detection
 * Returns Sharp instance regardless of input format (BMP, JPEG, PNG, etc.)
 * 
 * @param {Buffer} imageBuffer - Image buffer (any format)
 * @returns {Sharp} - Sharp instance
 */
export function smartSharp(imageBuffer) {
    if (isBMP(imageBuffer)) {
        console.info('[IMAGE] BMP format detected, converting to Sharp-compatible format');
        return sharpFromBMP(imageBuffer);
    } else {
        return sharp(imageBuffer);
    }
}
