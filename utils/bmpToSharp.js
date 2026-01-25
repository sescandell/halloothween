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
    const decoded = decodeBmp(bmpBuffer, { toRGBA: true });
    
    // Determine number of channels based on bit depth
    // 32-bit BMP = RGBA (4 channels), 24-bit = RGB (3 channels)
    // 1/4/8-bit with palette are converted to RGBA by toRGBA option
    const channels = decoded.bitPP === 32 ? 4 : 
                    decoded.bitPP === 24 ? 3 : 4;
    
    // Create Sharp instance from raw pixel data
    return sharp(decoded.data, {
        raw: {
            width: decoded.width,
            height: decoded.height,
            channels: channels
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
