;(function($, window, undefined){
    var DISPLAY_TIME = 6000; // ms
    // Cache DOM
    var $container = $('.container');
    var $img = $container.children('img');

    // Storage local
    var pictures = [];

    // connect to the socket
    var socket = io.connect('/socket');

    socket.on('connected', function(){
        socket.emit('loadPhotos');
    });

    socket.on('picture', function(path){
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

        return pictures[pictureToDisplay];
    }

    setInterval(function(){
        if (!pictures.length) {
            return;
        }

        $container.fadeOut(function(){
            $img.prop('src', getNextPicture());
            $container.fadeIn(800);
        });
    }, DISPLAY_TIME);
})(jQuery, window);