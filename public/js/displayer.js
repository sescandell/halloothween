;(function($, window, undefined){
    // Cache DOM
    var $img = $('.container img');
    var displayedImageIndex = -1;

    // Storage local
    var pictures = [];

    // connect to the socket
    var socket = io.connect('/socket');

    socket.on('connected', function(){
        console.log('Connected');
        socket.emit('loadPhotos');
    });

    socket.on('picture', function(path){
        console.log('Image disponible %o', path);
        pictures.push(path);
    });

    setInterval(function(){
        if (!pictures.length) {
            return;
        }

        if (++displayedImageIndex == pictures.length) {
            displayedImageIndex = 0;
        }

        $img.prop('src', pictures[displayedImageIndex]+'-'+displayedImageIndex+'-'+Math.random());
    }, 8000);
})(jQuery, window);