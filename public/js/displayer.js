;(function($, window, undefined){
    var DISPLAY_TIME = 6000; // ms
    // Cache DOM
    var $container = $('.container');
    var $img = $container.children('img');
    var audioHandler = $('.audio-player')[0];
    audioHandler.onplay = function() {
        stopTimer();
        $img.addClass('alarm');
    };
    audioHandler.onended = function() {
        startTimer();
        $img.removeClass('alarm');
    };

    // Storage local
    var pictures = [];

    // connect to the socket
    var socket = io.connect('/socket');

    socket.on('connected', function(){
        console.log('Connected');
        socket.emit('loadPhotos');
        startTimer();
    });

    socket.on('picture', function(path){
        console.log('Image disponible %o', path);
        pictures.push('/pictures/'+path);
    });

    socket.on('alarm', function(p){
        console.log('Alarm received with param %o', p);
        stopTimer();
        audioHandler.pause();
        audioHandler.currentTime = 0;
        $img.prop('src', '/img/alarm/' + p + '.jpg');
        $img.show();
        audioHandler.play();
    });

    var displayedImageIndex = pictures.length-1;
    // Dans 20% des cas on prend une image aléatoire
    // Dans les autres : on boucle sur les 20 dernières images.
    function getNextPicture() {
        var pictureToDisplay = Math.floor(Math.random() * (pictures.length-1));
        if (Math.random() >= 0.2) {
            if (++displayedImageIndex == pictures.length) {
                displayedImageIndex = pictures.length > 20 ? pictures.length - 20 : 0;
            }

            pictureToDisplay = displayedImageIndex;
        }

        return pictures[pictureToDisplay];
    }

    var timer = undefined;
    function startTimer() {
        if (timer) {
            return;
        }

        console.log('Démarrage du timer');
        timer = setInterval(function(){
            if (!timer) {
                return;
            }

            if (!pictures.length) {
                return;
            }
    
            $container.fadeOut(400, function(){
                if (!timer) {
                    return;
                }
                $img.prop('src', getNextPicture());
                $container.fadeIn(400);
            });
        }, DISPLAY_TIME);
    }

    function stopTimer() {
        console.log('Arrêt du timer');
        timer && clearInterval(timer);
        timer = undefined;
    }
    
})(jQuery, window);