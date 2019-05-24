var InMemoryStore = require('./utils/InMemoryStore');
var GPhoto = require('gphoto2');
var fs = require('fs');
var imageMagick = require('imagemagick');
var PICTURES_DIR = __dirname + '/public/pictures/';

module.exports = function(app,io){
    
    console.info('Chargement des caméras');
    var camera = undefined;
    // Storage in-memory des photos précédentes
    var picturesStore = new InMemoryStore(100);
    /*
    // killall  PTPCamera
    var gphoto = new GPhoto.GPhoto2();
    gphoto.list(function(cameras){
        if (!cameras.length) {
            throw 'Aucune caméra trouvée. Bye!';
        }

        camera = cameras[0];
        console.info('Caméra initialisée : %s', camera.model);
    });
    // */

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
        // Affichage
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

        for (var i = 0 in files) {
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

        socket.on('triggerAlarm', function(p) {
            console.info('TriggerAlarm received with params %o', p);
            socket.broadcast.emit('alarm', p);
        });

        socket.on('brigthness', function(v){
            socket.broadcast.emit('brigthness', v);
        });

        nspSocket.emit('cry');

        console.info('Envoi message "connected"');
        socket.emit('connected');
    });
};