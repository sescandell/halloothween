;(function($, window, undefined){
    alert('[HALLOOTHWEEN] Initialisation');
    var DISPLAY_TIME = 6000; // ms
    // Cache DOM
    var $container = $('.container');
    var $img = $container.children('img');

    // Storage local
    var pictures = [];

    // connect to the socket
    alert(window);
    var socket = io.connect('http://192.168.0.19/socket');

    socket.on('connected', function(){
        alert('[HALLOOTHWEEN] Connecté.');
        socket.emit('loadPhotos');
    });

    socket.on('picture', function(path){
        alert('[HALLOOTHWEEN] Image ' + path);
        pictures.push('/pictures/'+path);
    });

    var displayedImageIndex = pictures.length-1;
    // Dans 20% des cas on prend une image aléatoire
    // Dans les autres : on boucle sur les 10 dernières images.
    function getNextPicture() {
        var pictureToDisplay = Math.floor(Math.random() * (pictures.length-1));
        if (Math.random() >= 0.2) {
            if (++displayedImageIndex == pictures.length) {
                displayedImageIndex = pictures.length > 10 ? pictures.length - 10 : 0;
            }

            pictureToDisplay = displayedImageIndex;
        }

        alert('[HALLOOTHWEEN] Chargement de ' + pictures[pictureToDisplay]);

        return pictures[pictureToDisplay];
    }

    alert('[HALLOOTHWEEN] Mise en place timer');
    setInterval(function(){
        alert('[HALLOOTHWEEN] Tick');
        if (!pictures.length) {
            return;
        }

        $container.fadeOut(function(){
            $img.prop('src', 'http://192.168.0.19' + getNextPicture());
            $container.fadeIn(800);
        });
    }, DISPLAY_TIME);
    alert('[HALLOOTHWEEN] Fait');
})(jQuery, window);

alert('[HALLOOTHWEEN] En avant !!');