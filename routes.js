var InMemoryStore = require('./utils/InMemoryStore');
var GPhoto = require('gphoto2');
var fs = require('fs');
var imageMagick = require('imagemagick');


module.exports = function(app,io){
    var PICTURES_DIR = __dirname + '/public/pictures/';
    

    console.log('Chargement des caméras');
    var camera = undefined;
    // Storage in-memory des photos précédentes
    var picturesStore = new InMemoryStore(100);
    //*
    // killall  PTPCamera
    var gphoto = new GPhoto.GPhoto2();
    gphoto.list(function(cameras){
        if (!cameras.length) {
            throw 'Aucune caméra trouvée. Bye!';
        }

        camera = cameras[0];
        console.log('Caméra initialisée : %s', camera.model);
    });
    // */

    app.get('/', function(req, res){
        // Photo
        res.render('camera');
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

        console.log('[INFO] Images chargées : ' + picturesStore.size);
    });

    // Initialize a new socket.io application
    var nspSocket = io.of('/socket').on('connection', function (socket) {
        console.log('storing into ' + __dirname+'/tmp/foo.XXXXXX');
        socket.on('takePicture',function(){
            if (!camera) {
                return;
            }

            console.log('Taking picture from camera');
            camera.takePicture({
                download: true
            }, function (er, pictureData) {
                if (er) {
                    console.log(er);
                    return;
                }

                var pictureName = Date.now()+'.jpg';
                try {
                    fs.writeFileSync(PICTURES_DIR+pictureName, pictureData);
                } catch(e) {
                    console.log("Erreur save photo => " + e);
                    console.log(PICTURES_DIR+pictureName);
                    return;
                }
                
                picturesStore.add(pictureName);
                //*
                console.log('resizing...');
                try{
                    imageMagick.resize({
                        srcPath: PICTURES_DIR+pictureName,
                        dstPath: PICTURES_DIR+'../thumbnails/'+pictureName,
                        width: 158
                    }, function(err, stdout, stderr){
                        if (err) {
                            console.log(
                                'Error resizing file %s to %s',
                                PICTURES_DIR+pictureName,
                                PICTURES_DIR+'../thumbnails/'+pictureName
                            );
                            console.log("\t%o", err);

                            return;
                        }
                        console.log('done');
                        nspSocket.emit('picture', pictureName);
                    });
                } catch(e) {
                    console.log('error %o', e);
                }
                // */
            });
        });

        socket.on('triggerFired', function(){
            console.log('Trigger fired');
            socket.broadcast.emit('controllerTriggered');
        });

        socket.on('loadPhotos', function(){
            for (var index = 0; index < picturesStore.size; index++) {
                socket.emit('picture', picturesStore.get(index));
            }
        });

        socket.on('cry', function(){
            console.log('Please, everybody cry...');
            nspSocket.emit('cry');
        });

        socket.on('triggerAlarm', function(p) {
            console.log('TriggerAlarm received with params %o', p);
            socket.broadcast.emit('alarm', p);
        });

        socket.on('brigthness', function(v){
            socket.broadcast.emit('brigthness', v);
        });

        nspSocket.emit('cry');

        console.log('Envoi message "connected"');
        socket.emit('connected');
    });
};