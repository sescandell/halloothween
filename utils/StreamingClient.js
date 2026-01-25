/**
 * Streaming Client
 * Gère la connexion vers un service de streaming pour le streaming d'images
 */

import io from 'socket.io-client';
import fs from 'fs';
import path from 'path';

export class StreamingClient {
    constructor(config) {
        this.streamerUrl = config.streamerUrl;
        this.sharedSecret = config.sharedSecret;
        this.rpiId = config.rpiId || 'rpi-' + Date.now();
        this.picturesDir = config.picturesDir;
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        console.log(`[STREAMER] Initializing client for RPI: ${this.rpiId}`);
    }

    /**
     * Connect to Streaming Service
     */
    connect() {
        if (this.socket) {
            this.socket.disconnect();
        }

        console.log(`[STREAMER] Connecting to ${this.streamerUrl}...`);
        
        this.socket = io(this.streamerUrl, {
            auth: {
                token: this.sharedSecret
            },
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: this.maxReconnectAttempts,
            timeout: 60000,         // 60 secondes timeout
            forceNew: true,         // Force nouvelle connexion
            maxHttpBufferSize: 10e6 // 10MB buffer (côté client)
        });

        this.setupEventHandlers();
    }

    /**
     * Setup Socket.IO event handlers
     */
    setupEventHandlers() {
        this.socket.on('connect', () => {
            console.log(`[STREAMER] Connected to streaming service`);
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // Register this RPI
            this.socket.emit('register-rpi', { rpiId: this.rpiId });
        });

        this.socket.on('registration-confirmed', (data) => {
            console.log(`[STREAMER] RPI registration confirmed: ${data.rpiId}`);
        });

        this.socket.on('request-photo', (data) => {
            const { requestId, photoId } = data;
            console.log(`[STREAMER] Photo requested: ${photoId} (request: ${requestId})`);
            
            this.sendPhoto(requestId, photoId);
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`[STREAMER] Disconnected: ${reason}`);
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error(`[STREAMER] Connection error:`, error.message);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error(`[STREAMER] Max reconnection attempts reached. Giving up.`);
            }
        });
    }

    /**
     * Send photo to Streaming Service in response to a request
     */
    async sendPhoto(requestId, photoId) {
        try {
            const photoPath = path.join(this.picturesDir, photoId);
            
            if (!fs.existsSync(photoPath)) {
                console.error(`[STREAMER] Photo not found: ${photoPath}`);
                this.socket.emit('photo-error', {
                    requestId,
                    error: `Photo ${photoId} not found`
                });
                return;
            }

            // Read photo and convert to base64
            const photoBuffer = fs.readFileSync(photoPath);
            const photoData = photoBuffer.toString('base64');
            
            console.log(`[STREAMER] Sending photo ${photoId} (${photoBuffer.length} bytes)`);
            
            this.socket.emit('photo-data', {
                requestId,
                photoId,  // Include photoId for proper filename
                photoData,
                mimeType: 'image/jpeg'
            });
            
        } catch (error) {
            console.error(`[STREAMER] Error sending photo ${photoId}:`, error);
            this.socket.emit('photo-error', {
                requestId,
                error: error.message
            });
        }
    }

    /**
     * Check if connected to Streaming Service
     */
    isConnected() {
        return this.connected && this.socket && this.socket.connected;
    }

    /**
     * Disconnect from Streaming Service
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected = false;
    }
}
