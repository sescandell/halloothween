import { InMemoryStore } from './utils/InMemoryStore.js';
import { StreamingClient } from './utils/StreamingClient.js';
import { PrinterClient } from './utils/PrinterClient.js';
import appConfig, { updateConfig } from './app-config.js';
import { createCameraAdapter } from './utils/CameraAdapter.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { smartSharp } from './utils/bmpToSharp.js';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PICTURES_DIR = __dirname + '/public/pictures/';

// Mode de capture avec pause du flux vidéo
const PAUSE_STREAM_MODE = process.env.PAUSE_STREAM_ON_CAPTURE === 'true';
console.log(`[CONFIG] Pause stream mode: ${PAUSE_STREAM_MODE ? 'ENABLED' : 'DISABLED'}`);

// var OZW = require('openzwave-shared');
// var zwave = new OZW({
//     ConsoleOutput: false,
//     Logging: false,
//     SaveConfiguration: false,
//     DriverMaxAttempts: 3,
//     PollInterval: 500,
//     SuppressValueRefresh: false
// });
const NODE_ID_STRIP_CONTROLLER = 12;
const NODE_ID_LIGHT_CONTROLLER = 13;
const ZWAVE_CONTROLLER_PATH = '/dev/ttyACM0';
var stripControllerReady = false;
var lightControllerReady = false;
var zwaveStarted = false;

// Initialize Streaming Client
var streamingClient = null;
if (appConfig.streamer.enabled) {
    console.log('[STREAMER] Initializing Streaming Client...');
    streamingClient = new StreamingClient({
        streamerUrl: appConfig.streamer.url,
        sharedSecret: appConfig.streamer.sharedSecret,
        rpiId: appConfig.rpiId,
        picturesDir: PICTURES_DIR
    });
    
    // Connect to Streamer (with retry logic)
    streamingClient.connect();
} else {
    console.log('[STREAMER] Streaming disabled');
}

// Initialize Printer Client
var printerClient = null;
if (appConfig.printer.enabled) {
    console.log('[PRINTER] Initializing Printer Client...');
    printerClient = new PrinterClient({
        enabled: appConfig.printer.enabled,
        name: appConfig.printer.name,
        mode: appConfig.printer.mode,
        frameConfig: appConfig.printFrame
    });
    
    // Initialize will be called in the async function below
} else {
    console.log('[PRINTER] Printing disabled');
}

// zwave.on('connected', function(homeId) {
//     console.log('[ZWAVE] Connecté');
// });
// zwave.on('driver ready', function(homeId) {
//     console.log('[ZWAVE] Driver prêt');
//     zwaveStarted = true;
// });
// zwave.on('driver failed', function(homeId) {
//     console.log('[ZWAVE][ERROR] Driver FAILED');
//     zwave.disconnect();
// });
// zwave.on('node added', function(nodeId) {
//     console.log('[ZWAVE] node %d ajouté', nodeId);
// });
// zwave.on('node ready', function(nodeId) {
//     console.log('[ZWAVE] node %d prêt', nodeId);
//     if (nodeId == NODE_ID_STRIP_CONTROLLER) {
//         stripControllerReady = true;
//     } else if (nodeId == NODE_ID_LIGHT_CONTROLLER) {
//         // http://manuals.fibaro.com/content/manuals/en/FGD-212/FGD-212-EN-T-v1.3.pdf
//         lightControllerReady = true;
//         console.log('Forcing Bi-Stable');
//         zwave.setValue({node_id: 13, class_id: 112, instance: 1, index: 20}, 1);
//         console.log('Disable Dimmable');
//         zwave.setValue({node_id: 13, class_id: 112, instance: 1, index: 32}, 1); // 0 = Dimming | 1=ON/OFF | 2=AUTO
//     }
// });

// var lastColorLevel = 99;
// function setColorLevel(level) {
//     lastColorLevel = level;

//     zwave.setValue({node_id: NODE_ID_STRIP_CONTROLLER, class_id: 38, instance: 1, index: 0}, level);
// }

// var lastColor = '#FF0000';
// function setColor(c) {
//     lastColor = c;

//     zwave.setValue({node_id: NODE_ID_STRIP_CONTROLLER, class_id: 51, instance: 1, index: 0}, c);
// }

// var lastLightLevel = 10;
// function setLightLevel(l) {
//     lastLightLevel = l;

//     zwave.setValue({node_id: NODE_ID_LIGHT_CONTROLLER, class_id: 38, instance: 1, index: 0}, l);
// }

// Helper function pour sleep/delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// killall  PTPCamera
var camera = undefined;

async function initCamera() {
    console.info('Chargement des caméras');

    try {
        const adapter = await createCameraAdapter();
        const cameras = await adapter.list();
        
        if (!cameras.length) {
            console.error('Aucune caméra trouvée. Bye!');
            return;
        }

        camera = cameras[0];
        console.info('Caméra initialisée : %s', camera.model);
    } catch (error) {
        console.error('[CAMERA] Erreur lors de l\'initialisation:', error);
        throw error;
    }
}

// Helper: build config payload for frontend clients
function buildClientConfig() {
    const cfg = {
        rpiId: appConfig.rpiId,
        pauseStreamMode: appConfig.camera.pauseStreamOnCapture
    };
    if (streamingClient && appConfig.streamer.enabled) {
        cfg.streamerUrl = appConfig.streamer.url;
    }
    cfg.printerEnabled = appConfig.printer.enabled && printerClient && printerClient.isAvailable();
    return cfg;
}

// Helper: build full config for admin page
function getAdminConfig() {
    return {
        rpiId: appConfig.rpiId,
        streamer: {
            enabled: appConfig.streamer.enabled,
            url: appConfig.streamer.url,
            sharedSecret: appConfig.streamer.sharedSecret,
            connected: streamingClient ? streamingClient.isConnected() : false
        },
        printer: {
            enabled: appConfig.printer.enabled,
            name: appConfig.printer.name,
            mode: appConfig.printer.mode,
            available: printerClient ? printerClient.isAvailable() : false
        },
        printFrame: {
            enabled: appConfig.printFrame.enabled,
            framePath: appConfig.printFrame.framePath || '',
            available: printerClient && printerClient.frameComposer ? printerClient.frameComposer.isAvailable() : false
        }
    };
}

export default async function(app,io) {    
    await initCamera();
    
    // Initialize Printer Client (async operation)
    if (printerClient) {
        await printerClient.initialize();
    }

    // Storage in-memory des photos précédentes
    var picturesStore = new InMemoryStore(100);

    app.get('/', function(req, res){
        // Photo
        res.render('camera');
    });

    app.get('/all-in-one', function (req, res){
        res.render('all-in-one');
    });

    app.get('/controller', function(req,res){
        // Bouton de lancement
        res.render('controller');
    });

    app.get('/displayer', function(req,res){
        // Affichage
        res.render('displayer');
    });

    app.get('/manager', function(req,res){
        // Scènes
        res.render('manager');
    });

    app.get('/loadPictures', function(req, res) {
        res.json(picturesStore.items);
    });

    // ==========================================
    // ADMIN ROUTES
    // ==========================================

    app.get('/admin', function(req, res) {
        res.render('admin');
    });

    app.get('/api/admin/config', function(req, res) {
        res.json(getAdminConfig());
    });

    app.post('/api/admin/config', async function(req, res) {
        const changes = req.body;

        const streamerChanged = changes.streamer !== undefined;
        const printerChanged = changes.printer !== undefined;
        const frameChanged = changes.printFrame !== undefined;

        // Apply changes
        updateConfig(changes);

        // Reinit streamer if needed
        if (streamerChanged) {
            if (streamingClient) {
                streamingClient.disconnect();
                streamingClient = null;
            }
            if (appConfig.streamer.enabled) {
                streamingClient = new StreamingClient({
                    streamerUrl: appConfig.streamer.url,
                    sharedSecret: appConfig.streamer.sharedSecret,
                    rpiId: appConfig.rpiId,
                    picturesDir: PICTURES_DIR
                });
                streamingClient.connect();
                console.log('[ADMIN] Streamer reinitialized');
            } else {
                console.log('[ADMIN] Streamer disabled');
            }
        }

        // Reinit printer/frame if needed
        if (printerChanged || frameChanged) {
            printerClient = null;
            if (appConfig.printer.enabled) {
                printerClient = new PrinterClient({
                    enabled: appConfig.printer.enabled,
                    name: appConfig.printer.name,
                    mode: appConfig.printer.mode,
                    frameConfig: appConfig.printFrame
                });
                await printerClient.initialize();
                console.log('[ADMIN] Printer reinitialized');
            } else {
                console.log('[ADMIN] Printer disabled');
            }
        }

        // Broadcast updated config to all connected frontend clients
        io.of('/socket').emit('app-config', buildClientConfig());

        console.log('[ADMIN] Configuration updated');
        res.json({ success: true, config: getAdminConfig() });
    });

    app.post('/api/admin/package-pictures', async function(req, res) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveName = `pictures_${appConfig.rpiId}_${timestamp}.tar.gz`;
        const archivePath = path.join(__dirname, archiveName);

        // Check there are pictures to package
        const files = fs.readdirSync(PICTURES_DIR).filter(f => !f.startsWith('.'));
        if (files.length === 0) {
            return res.status(400).json({ error: 'Aucune photo à packager' });
        }

        try {
            await execAsync(`tar -czf "${archivePath}" -C "${PICTURES_DIR}" .`);

            res.set('Content-Type', 'application/gzip');
            res.set('Content-Disposition', `attachment; filename="${archiveName}"`);

            const stream = fs.createReadStream(archivePath);
            stream.pipe(res);
            stream.on('close', () => {
                try { fs.unlinkSync(archivePath); } catch(e) {}
            });
        } catch (error) {
            console.error('[ADMIN] Package error:', error);
            try { fs.unlinkSync(archivePath); } catch(e) {}
            res.status(500).json({ error: 'Échec de la création de l\'archive: ' + error.message });
        }
    });

    app.post('/api/admin/clean-pictures', async function(req, res) {
        const dirsToClean = [
            path.join(__dirname, 'public', 'pictures'),
            path.join(__dirname, 'public', 'display'),
            path.join(__dirname, 'public', 'thumbnails'),
            path.join(__dirname, 'public', 'print'),
            path.join(__dirname, 'public', 'print-framed')
        ];

        let totalDeleted = 0;

        for (const dir of dirsToClean) {
            if (!fs.existsSync(dir)) continue;

            const files = fs.readdirSync(dir);
            for (const file of files) {
                // Keep dotfiles (.keep, .gitkeep) and README
                if (file.startsWith('.') || file === 'README.md') continue;
                try {
                    fs.unlinkSync(path.join(dir, file));
                    totalDeleted++;
                } catch (e) {
                    console.error(`[ADMIN] Failed to delete ${file}:`, e.message);
                }
            }
        }

        // Reset in-memory store
        picturesStore.reset();

        // Notify all connected clients to reset their gallery
        io.of('/socket').emit('gallery-reset');

        console.log(`[ADMIN] Cleaned ${totalDeleted} files from ${dirsToClean.length} directories`);
        res.json({ success: true, deleted: totalDeleted });
    });

    app.post('/api/admin/reload-frame', async function(req, res) {
        try {
            if (!printerClient) {
                return res.status(400).json({ error: 'Imprimante non initialisée (activez l\'imprimante d\'abord)' });
            }
            if (!printerClient.frameComposer) {
                return res.status(400).json({ error: 'Cadre non configuré (activez le cadre dans la configuration)' });
            }
            await printerClient.frameComposer.initialize();
            res.json({
                success: true,
                available: printerClient.frameComposer.isAvailable()
            });
        } catch (error) {
            console.error('[ADMIN] Reload frame error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/admin/frame-preview', function(req, res) {
        if (!appConfig.printFrame.framePath) {
            return res.status(404).json({ error: 'Aucun cadre configuré' });
        }
        const absolutePath = path.resolve(process.cwd(), appConfig.printFrame.framePath);
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'Fichier cadre introuvable: ' + appConfig.printFrame.framePath });
        }
        res.sendFile(absolutePath);
    });

    // ==========================================
    // END ADMIN ROUTES
    // ==========================================

    fs.readdir(PICTURES_DIR, function(err, files){
        if (err) {
            console.error('[ERROR] Chargement images en échec : ' + err);

            return;
        }

        for (var i in files) {
            if ('.' == files[i][0]) {
                continue;
            }
            picturesStore.add(files[i]);
        }

        console.info('[INFO] Images chargées : ' + picturesStore.size);
    });

    // Initialize a new socket.io application
    var nspSocket = io.of('/socket').on('connection', function (socket) {
        // Fonction de capture photo (extraite pour réutilisation)
        async function capturePhoto() {
            console.info('Taking picture from camera');
            if (!camera) {
                throw new Error('No camera available');
            }

            try {
                console.info('Starting camera capture...');
                
                // Si mode pause, attendre 1s pour que Windows libère la webcam
                if (PAUSE_STREAM_MODE) {
                    console.info('[PAUSE MODE] Waiting 1s for stream release...');
                    await sleep(1000);
                }
                
                // Utiliser l'API async/await de la caméra
                const pictureData = await camera.takePicture({
                    download: true
                });

                const pictureName = Date.now() + '.jpg';
                
                // Auto-detect BMP and convert if needed, otherwise use Sharp directly
                const sharpInstance = smartSharp(pictureData);
                
                // Save original image as JPEG
                await sharpInstance
                    .clone()
                    .jpeg({ quality: 95, progressive: true })
                    .toFile(PICTURES_DIR + pictureName);
                
                picturesStore.add(pictureName);
                nspSocket.emit('picture', pictureName);
                
                // Generate thumbnail and display versions in parallel
                await Promise.all([
                    // Thumbnail 158px
                    sharpInstance
                        .clone()
                        .resize(158, null, { fit: 'inside', withoutEnlargement: true })
                        .jpeg({ quality: 90, progressive: true })
                        .toFile(PICTURES_DIR + '../thumbnails/' + pictureName)
                        .then(() => {
                            nspSocket.emit('picture-thumbnail', pictureName);
                        }),
                    
                    // Display 1024px
                    sharpInstance
                        .clone()
                        .resize(1024, null, { fit: 'inside', withoutEnlargement: true })
                        .jpeg({ quality: 90, progressive: true })
                        .toFile(PICTURES_DIR + '../display/' + pictureName)
                        .then(() => {
                            nspSocket.emit('picture-display', pictureName);
                        })
                ]);
                
                console.info('[IMAGE] Photo processing complete:', pictureName);
                
            } catch (error) {
                console.error('Erreur prise de photo:', error);
                throw error;
            }
        }

        socket.on('takePicture', async () => {
            console.info(`[DEBUG] takePicture called for socket ${socket.id}`);
            if (!camera) {
                return;
            }

            if (PAUSE_STREAM_MODE) {
                // Attendre confirmation avec timeout de 5s
                // IMPORTANT: Enregistrer le listener AVANT d'émettre la requête
                const streamPausedPromise = new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Stream pause timeout (5s)'));
                    }, 5000);
                    
                    const handler = () => {
                        clearTimeout(timeout);
                        console.info('[PAUSE MODE] Stream paused confirmed');
                        resolve();
                    };
                    
                    // Enregistrer le listener AVANT d'émettre
                    socket.once('streamPaused', handler);
                    
                    // Maintenant on peut émettre la requête en toute sécurité
                    console.info('[PAUSE MODE] Requesting stream pause...');
                    socket.emit('requestStreamPause');
                });
                
                try {
                    await streamPausedPromise;
                    await capturePhoto();
                } catch (error) {
                    console.error('[PAUSE MODE] Error:', error);
                    socket.emit('captureError', {
                        message: 'Erreur lors de la capture. Veuillez réessayer.'
                    });
                }
            } else {
                // Mode direct : capture immédiate
                try {
                    await capturePhoto();
                } catch (error) {
                    socket.emit('captureError', {
                        message: 'Erreur lors de la capture. Veuillez réessayer.'
                    });
                }
            }
        });

        socket.on('triggerFired', function(){
            console.info('Trigger fired');
            socket.broadcast.emit('controllerTriggered');
        });

        socket.on('loadPhotos', function(){
            for (var index = 0; index < picturesStore.size; index++) {
                socket.emit('gallery', picturesStore.get(index));
            }
        });

        socket.on('cry', function(){
            console.info('Please, everybody cry...');
            nspSocket.emit('cry');
        });

        // socket.on('triggerAlarm', function(p) {
        //     console.info('TriggerAlarm received with params %o', p);
        //     socket.broadcast.emit('alarm', p);

        //     if (zwaveStarted) {
        //         var previousColorLevel = lastColorLevel;
        //         var previousColor = lastColor;
        //         var previousLevel = lastLightLevel;
        //         setColor('#FF0000');
        //         setLightLevel(0);
        //         setTimeout(function(){
        //             setColor(previousColor);
        //             setColorLevel(previousColorLevel);
        //             setLightLevel(previousLevel);
        //         }, 22000)
        //     }
        // });
        // Vitesse de rotation du Girophare
        // socket.on('speed', function(v){
        //     socket.broadcast.emit('speed', v);
        // });
        // socket.on('zwaveStart', function() {
        //     if (zwaveStarted) {
        //         return;
        //     }
        //     console.log('Connexion zWave');
        //     zwave.connect(ZWAVE_CONTROLLER_PATH);
        // });
        // socket.on('zwaveSetColor', function(c) {
        //     if (!stripControllerReady) {
        //         return;
        //     }
        //     console.log('Définition de la couleur à %s', c);
        //     setColor(c);
        //     setColorLevel(lastColorLevel);
        // });
        
        // socket.on('zwaveSetLevel', function(l) {
        //     if (!stripControllerReady) {
        //         return;
        //     }
        //     console.log('Définition du level à %d', l);
        //     setColorLevel(l);
        // });

        // socket.on('zwaveSetLight', function(l) {
        //     if (!lightControllerReady) {
        //         return;
        //     }

        //     console.log('Définition de la lumière à %d', l);
        //     setLightLevel(l == '0' ? 0 : 10);
        // });

        // socket.on('zwaveSetLightLevel', function(l) {
        //     console.log('Définition de la lumière à %d', parseInt(l, 10));

        //     setLightLevel(parseInt(l, 10));
        // });

        socket.on('initCamera', initCamera);

        // Print photo event
        socket.on('printPhoto', async (data) => {
            const { photoId } = data;
            console.log(`[PRINTER] Print request for: ${photoId}`);
            
            if (!printerClient || !printerClient.isAvailable()) {
                socket.emit('printError', { 
                    message: 'Imprimante non disponible' 
                });
                return;
            }
            
            try {
                const photoPath = PICTURES_DIR + photoId;
                await printerClient.printPhoto(photoPath, (status) => {
                    // Forward progress status to client
                    socket.emit('printStatus', { status });
                });
                socket.emit('printSuccess', { photoId });
            } catch (error) {
                console.error('[PRINTER] Error:', error);
                socket.emit('printError', { 
                    message: 'Erreur lors de l\'impression: ' + error.message 
                });
            }
        });

        nspSocket.emit('cry');

        console.info('Envoi message "connected"');
        socket.emit('connected');
        
        // Send configuration to frontend
        socket.emit('app-config', buildClientConfig());
    });
};