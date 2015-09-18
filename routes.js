var InMemoryStore = require('./utils/InMemoryStore');
var GPhoto = require('gphoto2');

module.exports = function(app,io){

    /*
    console.log('Chargement des caméras');
    var camera = undefined;
    var gphoto = GPhoto.GPhoto2();
    gphoto.list(function(cameras){
        console.log('Cameras listées');
        if (!cameras.length) {
            throw 'Aucune caméra trouvée. Bye!';
        }

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

    // Initialize a new socket.io application
    var nspSocket = io.of('/socket').on('connection', function (socket) {
        socket.on('takePicture',function(){
            console.log('Taking picture');
            setTimeout(function(){
                picturesStore.add('path_to_image');
                nspSocket.emit('picture', picturesStore.last());
            }, 3000);
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