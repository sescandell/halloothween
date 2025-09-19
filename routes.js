var InMemoryStore = require('./utils/InMemoryStore');
var AzureStreamingClient = require('./utils/AzureStreamingClient');
var azureConfig = require('./azure-config');
var GPhoto = require('gphoto2');
var fs = require('fs');
var imageMagick = require('imagemagick');
var PICTURES_DIR = __dirname + '/public/pictures/';
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
var gphoto = new GPhoto.GPhoto2();
var camera = undefined;
function initCamera() {
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

module.exports = function(app,io) {    
    initCamera();

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
        socket.on('takePicture',function(){
            console.info('Taking picture from camera');
            if (!camera) {
                return;
            }

            console.info('Taking picture from camera');
            camera.takePicture({
                download: true
            }, function (er, pictureData) {
                if (er) {
                    console.error('Erreur prise de photo : %o', er);

                    return;
                }

                var pictureName = Date.now()+'.jpg';
                try {
                    fs.writeFileSync(PICTURES_DIR+pictureName, pictureData);
                } catch(e) {
                    console.error("Erreur save photo => " + e);
                    console.error(PICTURES_DIR+pictureName);

                    return;
                }
                
                picturesStore.add(pictureName);
                nspSocket.emit('picture', pictureName);
                
                //*
                console.info('Redimensionnements en cours ...');
                try{
                    imageMagick.resize({
                        srcPath: PICTURES_DIR+pictureName,
                        dstPath: PICTURES_DIR+'../thumbnails/'+pictureName,
                        width: 158
                    }, function(err, stdout, stderr){
                        if (err) {
                            console.error(
                                'Error resizing file %s to %s',
                                PICTURES_DIR+pictureName,
                                PICTURES_DIR+'../thumbnails/'+pictureName
                            );
                            console.error("\t%o", err);

                            return;
                        }
                        console.info("\tThumbnail fait !");
                        nspSocket.emit('picture-thumbnail', pictureName);
                    });
                    imageMagick.resize({
                        srcPath: PICTURES_DIR+pictureName,
                        dstPath: PICTURES_DIR+'../display/'+pictureName,
                        width: 1024
                    }, function(err, stdout, stderr){
                        if (err) {
                            console.error(
                                'Error resizing display file %s to %s',
                                PICTURES_DIR+pictureName,
                                PICTURES_DIR+'../display/'+pictureName
                            );
                            console.error("\t%o", err);

                            return;
                        }
                        console.info("\tDisplay fait !");
                        nspSocket.emit('picture-display', pictureName);
                    });
                } catch(e) {
                    console.error('Erreur %o', e);
                }
                // */
            });
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
        
        // Send Azure URL to front if Azure is enabled
        if (azureClient && azureConfig.enabled) {
            socket.emit('azure-config', {
                azureUrl: azureConfig.azureUrl,
                rpiId: azureConfig.rpiId
            });
        }
    });
};