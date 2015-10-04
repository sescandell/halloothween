var InMemoryStore = require('./utils/InMemoryStore');
var GPhoto = require('gphoto2');
var fs = require('fs');
var imageMagick = require('imagemagick');

module.exports = function(app,io){
    var PICTURES_DIR = __dirname + '/public/pictures/';

    console.log('Chargement des caméras');
    var camera = undefined;
    //*
    var gphoto = new GPhoto.GPhoto2();
    gphoto.list(function(cameras){
        console.log('Caméras listées');
        if (!cameras.length) {
            throw 'Aucune caméra trouvée. Bye!';
        }

        console.log('Caméra initialisée');
        camera = cameras[0];
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

    // Storage in-memory des photos précédentes
    var picturesStore = new InMemoryStore(100);

    fs.readdir(PICTURES_DIR, function(err, files){
        if (err) {
            console.error('[ERROR] Chargement images en échec : ' + err);
            return;
        }

        for (var i = 0 in files) {
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
                targetPath: __dirname+'/tmp/foo.XXXXXX'
            }, function (er, tmpname) {
                var pictureName = Date.now()+'.jpg';
                fs.renameSync(tmpname, PICTURES_DIR+pictureName);
                picturesStore.add(pictureName);
                console.log('resizing...');
                imageMagick.resize({
                    srcPath: PICTURES_DIR+pictureName,
                    dstPath: PICTURES_DIR+'../thumbnails/'+pictureName,
                    width: 158
                }, function(err, stdout, stderr){
                    if (err) {
                        throw err;
                    }
                    nspSocket.emit('picture', pictureName);
                });
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

        socket.emit('connected');
    });
};