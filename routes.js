import { InMemoryStore } from './utils/InMemoryStore.js';
import { AzureStreamingClient } from './utils/AzureStreamingClient.js';
import azureConfig from './azure-config.js';
import { createCameraAdapter } from './utils/CameraAdapter.js';
import fs from 'fs';
import sharp from 'sharp';
import { smartSharp } from './utils/bmpToSharp.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Initialize Azure Streaming Client
var azureClient = null;
if (azureConfig.enabled) {
    console.log('[AZURE] Initializing Azure Streaming Client...');
    azureClient = new AzureStreamingClient({
        azureUrl: azureConfig.azureUrl,
        sharedSecret: azureConfig.sharedSecret,
        rpiId: azureConfig.rpiId,
        picturesDir: PICTURES_DIR
    });
    
    // Connect to Azure (with retry logic)
    azureClient.connect();
} else {
    console.log('[AZURE] Azure streaming disabled');
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

// killall  PTPCamera
var gphoto = await createCameraAdapter();
var camera = undefined;
async function initCamera() {
    console.info('Chargement des caméras');

    gphoto.list(function(cameras){
        if (!cameras.length) {
            console.error('Aucune caméra trouvée. Bye!');
            return;
        }

        camera = cameras[0];
        console.info('Caméra initialisée : %s', camera.model);
    });
}

export default async function(app,io) {    
    await initCamera();

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
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // Promisifier camera.takePicture()
                const pictureData = await new Promise((resolve, reject) => {
                    camera.takePicture({
                        download: true
                    }, (er, data) => {
                        if (er) reject(er);
                        else resolve(data);
                    });
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
            if (!camera) {
                return;
            }

            if (PAUSE_STREAM_MODE) {
                // Mode pause : demander au frontend d'arrêter le stream
                console.info('[PAUSE MODE] Requesting stream pause...');
                socket.emit('requestStreamPause');
                
                // Attendre confirmation avec timeout de 5s
                const streamPausedPromise = new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Stream pause timeout (5s)'));
                    }, 5000);
                    
                    socket.once('streamPaused', () => {
                        clearTimeout(timeout);
                        console.info('[PAUSE MODE] Stream paused confirmed');
                        resolve();
                    });
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

        socket.on('streamPaused', function() {
            // Cet événement est géré par le promise dans takePicture
            // On le laisse vide car il est déjà écouté avec socket.once
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

        nspSocket.emit('cry');

        console.info('Envoi message "connected"');
        socket.emit('connected');
        
        // Send configuration to frontend (Azure + pause mode)
        if (azureClient && azureConfig.enabled) {
            socket.emit('azure-config', {
                azureUrl: azureConfig.azureUrl,
                rpiId: azureConfig.rpiId,
                pauseStreamMode: PAUSE_STREAM_MODE
            });
        } else {
            // Même sans Azure, envoyer le mode pause
            socket.emit('azure-config', {
                pauseStreamMode: PAUSE_STREAM_MODE
            });
        }
    });
};